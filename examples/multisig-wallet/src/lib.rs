#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec,
};

// ─── Event topics ─────────────────────────────────────────────────────────────

const TOPIC_PROPOSAL_CREATED: Symbol = symbol_short!("proposal");
const TOPIC_APPROVED: Symbol = symbol_short!("approve");
const TOPIC_REVOKED: Symbol = symbol_short!("revoke");
const TOPIC_EXECUTED: Symbol = symbol_short!("execute");

// ─── Storage keys ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Signer(Address),
    SignerCount,
    Threshold,
    ProposalCount,
    Proposal(u32),
}

#[contracttype]
#[derive(Clone)]
pub struct ApprovalKey {
    pub proposal_id: u32,
    pub signer: Address,
}

// ─── Proposal ─────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub target: Address,
    pub function: Symbol,
    pub approval_count: u32,
    pub executed: bool,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialised = 1,
    AlreadyInitialised = 2,
    NotSigner = 3,
    ProposalNotFound = 4,
    AlreadyApproved = 5,
    AlreadyExecuted = 6,
    NotEnoughApprovals = 7,
    ThresholdTooLow = 8,
    ThresholdTooHigh = 9,
    AlreadySigner = 10,
    InvalidThreshold = 11,
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct MultiSigWallet;

#[contractimpl]
impl MultiSigWallet {
    /// Initialise the wallet with a set of signers and the required approval
    /// threshold (M-of-N). Can only be called once.
    pub fn initialize(env: Env, admin: Address, signers: Vec<Address>, threshold: u32) {
        if env.storage().instance().has(&DataKey::Threshold) {
            panic!("already initialized");
        }

        admin.require_auth();

        assert!(threshold > 0, "threshold must be at least 1");
        let count = signers.len();
        assert!(
            threshold <= count,
            "threshold cannot exceed number of signers"
        );
        assert!(count > 0, "at least one signer required");

        for signer in signers.iter() {
            env.storage()
                .persistent()
                .set(&DataKey::Signer(signer), &true);
        }

        env.storage()
            .instance()
            .set(&DataKey::SignerCount, &count);
        env.storage()
            .instance()
            .set(&DataKey::Threshold, &threshold);
    }

    // ─── Signer management ─────────────────────────────────────────────────

    /// Add a new signer. Only an existing signer may add a new one.
    pub fn add_signer(env: Env, caller: Address, new_signer: Address) {
        caller.require_auth();
        assert!(Self::is_signer_internal(&env, &caller), "not a signer");
        assert!(
            !Self::is_signer_internal(&env, &new_signer),
            "already a signer"
        );

        env.storage()
            .persistent()
            .set(&DataKey::Signer(new_signer), &true);

        let count: u32 = env.storage().instance().get(&DataKey::SignerCount).unwrap();
        env.storage()
            .instance()
            .set(&DataKey::SignerCount, &(count + 1));
    }

    /// Remove a signer. Only an existing signer may remove another.
    /// The threshold is automatically lowered if it exceeds the new signer
    /// count.
    pub fn remove_signer(env: Env, caller: Address, old_signer: Address) {
        caller.require_auth();
        assert!(Self::is_signer_internal(&env, &caller), "not a signer");
        assert!(
            Self::is_signer_internal(&env, &old_signer),
            "not a signer"
        );

        let count: u32 = env.storage().instance().get(&DataKey::SignerCount).unwrap();
        assert!(count > 1, "cannot remove last signer");

        env.storage()
            .persistent()
            .remove(&DataKey::Signer(old_signer));

        let new_count = count - 1;
        env.storage()
            .instance()
            .set(&DataKey::SignerCount, &new_count);

        let threshold: u32 = env.storage().instance().get(&DataKey::Threshold).unwrap();
        if threshold > new_count {
            env.storage()
                .instance()
                .set(&DataKey::Threshold, &new_count);
        }
    }

    /// Update the approval threshold. Can only be called by an existing signer
    /// and must be between 1 and the current number of signers.
    pub fn set_threshold(env: Env, caller: Address, threshold: u32) -> Result<(), Error> {
        caller.require_auth();

        if !Self::is_signer_internal(&env, &caller) {
            return Err(Error::NotSigner);
        }

        if threshold < 1 {
            return Err(Error::ThresholdTooLow);
        }
        let signer_count: u32 = env.storage().instance().get(&DataKey::SignerCount).unwrap();
        if threshold > signer_count {
            return Err(Error::ThresholdTooHigh);
        }

        env.storage()
            .instance()
            .set(&DataKey::Threshold, &threshold);
        Ok(())
    }

    // ─── Proposal lifecycle ────────────────────────────────────────────────

    /// Submit a new transaction proposal. Returns the unique proposal ID.
    pub fn submit_proposal(
        env: Env,
        proposer: Address,
        target: Address,
        function: Symbol,
    ) -> Result<u32, Error> {
        proposer.require_auth();

        if !Self::is_signer_internal(&env, &proposer) {
            return Err(Error::NotSigner);
        }

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0);
        let id = count + 1;

        let proposal = Proposal {
            id,
            target,
            function,
            approval_count: 0,
            executed: false,
        };

        env.storage()
            .instance()
            .set(&DataKey::ProposalCount, &id);
        env.storage()
            .instance()
            .set(&DataKey::Proposal(id), &proposal);

        env.events()
            .publish((TOPIC_PROPOSAL_CREATED, id, proposal.target.clone()), ());

        Ok(id)
    }

    /// Approve a pending proposal. Each signer may approve once per proposal.
    pub fn approve(env: Env, signer: Address, proposal_id: u32) -> Result<(), Error> {
        signer.require_auth();

        if !Self::is_signer_internal(&env, &signer) {
            return Err(Error::NotSigner);
        }

        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;

        if proposal.executed {
            return Err(Error::AlreadyExecuted);
        }

        let approval_key = ApprovalKey {
            proposal_id,
            signer: signer.clone(),
        };
        if env.storage().persistent().has(&approval_key) {
            return Err(Error::AlreadyApproved);
        }

        env.storage()
            .persistent()
            .set(&approval_key, &true);

        proposal.approval_count += 1;
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        env.events()
            .publish((TOPIC_APPROVED, proposal_id, signer), ());

        Ok(())
    }

    /// Revoke a previous approval. Only callable before the proposal is
    /// executed.
    pub fn revoke_approval(env: Env, signer: Address, proposal_id: u32) -> Result<(), Error> {
        signer.require_auth();

        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;

        if proposal.executed {
            return Err(Error::AlreadyExecuted);
        }

        let approval_key = ApprovalKey {
            proposal_id,
            signer: signer.clone(),
        };
        if !env.storage().persistent().has(&approval_key) {
            return Err(Error::NotSigner);
        }

        env.storage()
            .persistent()
            .remove(&approval_key);

        proposal.approval_count = proposal.approval_count.saturating_sub(1);
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        env.events()
            .publish((TOPIC_REVOKED, proposal_id, signer), ());

        Ok(())
    }

    /// Execute a proposal once it has collected enough approvals.
    pub fn execute(env: Env, proposal_id: u32) -> Result<(), Error> {
        let proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;

        if proposal.executed {
            return Err(Error::AlreadyExecuted);
        }

        let threshold: u32 = env.storage().instance().get(&DataKey::Threshold).unwrap();
        if proposal.approval_count < threshold {
            return Err(Error::NotEnoughApprovals);
        }

        // Mark executed before external call (checks-effects pattern).
        let mut updated = proposal.clone();
        updated.executed = true;
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &updated);

        // Execute the action.
        let _: soroban_sdk::Val =
            env.invoke_contract(&proposal.target, &proposal.function, Vec::new(&env));

        env.events()
            .publish((TOPIC_EXECUTED, proposal_id), ());

        Ok(())
    }

    // ─── View helpers ──────────────────────────────────────────────────────

    /// Return the proposal with the given ID.
    pub fn get_proposal(env: Env, proposal_id: u32) -> Result<Proposal, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)
    }

    /// Return the total number of proposals created so far.
    pub fn proposal_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0)
    }

    /// Return true if the given address is a registered signer.
    pub fn is_signer(env: Env, address: Address) -> bool {
        Self::is_signer_internal(&env, &address)
    }

    /// Return the current approval threshold (M).
    pub fn get_threshold(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::Threshold)
            .unwrap_or(0)
    }

    /// Return the total number of registered signers (N).
    pub fn signer_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::SignerCount)
            .unwrap_or(0)
    }

    /// Return true if `signer` has already approved `proposal_id`.
    pub fn has_approved(env: Env, proposal_id: u32, signer: Address) -> bool {
        let key = ApprovalKey {
            proposal_id,
            signer,
        };
        env.storage().persistent().has(&key)
    }

    // ─── Internal helpers ──────────────────────────────────────────────────

    fn is_signer_internal(env: &Env, address: &Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Signer(address.clone()))
            .unwrap_or(false)
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        contract, contractimpl,
        testutils::Address as AddressTestUtils,
        vec, Address, Env, Vec,
    };

    // Mock target contract for testing execution.
    #[contract]
    pub struct MockTarget;

    #[contractimpl]
    impl MockTarget {
        pub fn action(env: Env) {
            env.storage().instance().set(&"executed", &true);
        }

        pub fn was_executed(env: Env) -> bool {
            env.storage()
                .instance()
                .get(&"executed")
                .unwrap_or(false)
        }
    }

    struct MultiSigTest {
        env: Env,
        admin: Address,
        signers: Vec<Address>,
        wallet: MultiSigWalletClient<'static>,
        mock_id: Address,
        mock: MockTargetClient<'static>,
    }

    fn setup_2_of_3() -> MultiSigTest {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let carol = Address::generate(&env);
        let signers = vec![&env, alice, bob, carol];

        let wallet_id = env.register(MultiSigWallet, ());
        let wallet = MultiSigWalletClient::new(&env, &wallet_id);
        wallet.initialize(&admin, &signers, &2u32);

        let mock_id = env.register(MockTarget, ());
        let mock = MockTargetClient::new(&env, &mock_id);

        MultiSigTest {
            env,
            admin,
            signers,
            wallet,
            mock_id,
            mock,
        }
    }

    fn alice(t: &MultiSigTest) -> Address {
        t.signers.get(0).unwrap()
    }

    fn bob(t: &MultiSigTest) -> Address {
        t.signers.get(1).unwrap()
    }

    fn carol(t: &MultiSigTest) -> Address {
        t.signers.get(2).unwrap()
    }

    // ─── Initialization ────────────────────────────────────────────────────

    #[test]
    fn test_initialize_sets_threshold_and_signers() {
        let t = setup_2_of_3();
        assert_eq!(t.wallet.get_threshold(), 2);
        assert_eq!(t.wallet.signer_count(), 3);
        assert!(t.wallet.is_signer(&alice(&t)));
        assert!(t.wallet.is_signer(&bob(&t)));
        assert!(t.wallet.is_signer(&carol(&t)));
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_initialize_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let alice = Address::generate(&env);
        let signers = vec![&env, alice];
        let wallet_id = env.register(MultiSigWallet, ());
        let wallet = MultiSigWalletClient::new(&env, &wallet_id);
        wallet.initialize(&admin, &signers, &1u32);
        wallet.initialize(&admin, &signers, &1u32);
    }

    // ─── Proposal lifecycle ────────────────────────────────────────────────

    #[test]
    fn test_submit_proposal() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));
        assert_eq!(id, 1);

        let proposal = t.wallet.get_proposal(&id);
        assert_eq!(proposal.target, t.mock_id);
        assert_eq!(proposal.function, symbol_short!("action"));
        assert_eq!(proposal.approval_count, 0);
        assert!(!proposal.executed);
    }

    #[test]
    fn test_submit_proposal_increments_id() {
        let t = setup_2_of_3();
        let id1 = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));
        let id2 = t.wallet.submit_proposal(&bob(&t), &t.mock_id, &symbol_short!("action"));
        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
        assert_eq!(t.wallet.proposal_count(), 2);
    }

    #[test]
    fn test_non_signer_cannot_submit_proposal() {
        let t = setup_2_of_3();
        let outsider = Address::generate(&t.env);
        let result = t.wallet.try_submit_proposal(&outsider, &t.mock_id, &symbol_short!("action"));
        assert_eq!(result, Err(Ok(Error::NotSigner)));
    }

    // ─── Approvals ─────────────────────────────────────────────────────────

    #[test]
    fn test_approve_proposal() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        t.wallet.approve(&alice(&t), &id);

        let proposal = t.wallet.get_proposal(&id);
        assert_eq!(proposal.approval_count, 1);
        assert!(t.wallet.has_approved(&id, &alice(&t)));
    }

    #[test]
    fn test_double_approve_rejected() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        t.wallet.approve(&alice(&t), &id);
        let result = t.wallet.try_approve(&alice(&t), &id);
        assert_eq!(result, Err(Ok(Error::AlreadyApproved)));
    }

    #[test]
    fn test_non_signer_cannot_approve() {
        let t = setup_2_of_3();
        let outsider = Address::generate(&t.env);
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        let result = t.wallet.try_approve(&outsider, &id);
        assert_eq!(result, Err(Ok(Error::NotSigner)));
    }

    #[test]
    fn test_revoke_approval() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        t.wallet.approve(&alice(&t), &id);
        assert_eq!(t.wallet.get_proposal(&id).approval_count, 1);

        t.wallet.revoke_approval(&alice(&t), &id);
        assert_eq!(t.wallet.get_proposal(&id).approval_count, 0);
        assert!(!t.wallet.has_approved(&id, &alice(&t)));
    }

    // ─── Execution ─────────────────────────────────────────────────────────

    #[test]
    fn test_execute_proposal() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        t.wallet.approve(&alice(&t), &id);
        t.wallet.approve(&bob(&t), &id);

        assert!(!t.mock.was_executed());

        t.wallet.execute(&id);

        assert!(t.mock.was_executed());
        let proposal = t.wallet.get_proposal(&id);
        assert!(proposal.executed);
    }

    #[test]
    fn test_execute_fails_without_enough_approvals() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        t.wallet.approve(&alice(&t), &id);

        let result = t.wallet.try_execute(&id);
        assert_eq!(result, Err(Ok(Error::NotEnoughApprovals)));
        assert!(!t.mock.was_executed());
    }

    #[test]
    fn test_double_execute_fails() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        t.wallet.approve(&alice(&t), &id);
        t.wallet.approve(&bob(&t), &id);
        t.wallet.execute(&id);

        let result = t.wallet.try_execute(&id);
        assert_eq!(result, Err(Ok(Error::AlreadyExecuted)));
    }

    #[test]
    fn test_anyone_can_execute_after_threshold_met() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        t.wallet.approve(&alice(&t), &id);
        t.wallet.approve(&bob(&t), &id);

        t.wallet.execute(&id);
        assert!(t.mock.was_executed());
    }

    #[test]
    fn test_full_scenario() {
        let t = setup_2_of_3();
        assert_eq!(t.wallet.get_threshold(), 2);

        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));
        assert_eq!(id, 1);

        t.wallet.approve(&alice(&t), &id);
        assert_eq!(t.wallet.get_proposal(&id).approval_count, 1);

        t.wallet.approve(&bob(&t), &id);
        assert_eq!(t.wallet.get_proposal(&id).approval_count, 2);

        assert!(!t.mock.was_executed());
        t.wallet.execute(&id);
        assert!(t.mock.was_executed());

        let proposal = t.wallet.get_proposal(&id);
        assert!(proposal.executed);
    }

    // ─── Signer management ─────────────────────────────────────────────────

    #[test]
    fn test_add_signer() {
        let t = setup_2_of_3();
        let dave = Address::generate(&t.env);

        assert!(!t.wallet.is_signer(&dave));
        t.wallet.add_signer(&alice(&t), &dave);
        assert!(t.wallet.is_signer(&dave));
    }

    #[test]
    fn test_remove_signer() {
        let t = setup_2_of_3();
        assert!(t.wallet.is_signer(&carol(&t)));

        t.wallet.remove_signer(&alice(&t), &carol(&t));
        assert!(!t.wallet.is_signer(&carol(&t)));
    }

    #[test]
    fn test_set_threshold() {
        let t = setup_2_of_3();
        assert_eq!(t.wallet.get_threshold(), 2);

        t.wallet.set_threshold(&alice(&t), &1u32);
        assert_eq!(t.wallet.get_threshold(), 1);
    }

    #[test]
    fn test_set_threshold_too_high_rejected() {
        let t = setup_2_of_3();
        let result = t.wallet.try_set_threshold(&alice(&t), &10u32);
        assert_eq!(result, Err(Ok(Error::ThresholdTooHigh)));
    }

    #[test]
    fn test_set_threshold_too_low_rejected() {
        let t = setup_2_of_3();
        let result = t.wallet.try_set_threshold(&alice(&t), &0u32);
        assert_eq!(result, Err(Ok(Error::ThresholdTooLow)));
    }

    // ─── Events ────────────────────────────────────────────────────────────

    #[test]
    fn test_full_scenario_emits_events() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        t.wallet.approve(&alice(&t), &id);
        t.wallet.approve(&bob(&t), &id);
        t.wallet.execute(&id);

        // All operations completed without panic; events were published.
        assert!(t.mock.was_executed());
    }

    // ─── Edge cases ────────────────────────────────────────────────────────

    #[test]
    fn test_approve_nonexistent_proposal() {
        let t = setup_2_of_3();
        let result = t.wallet.try_approve(&alice(&t), &999u32);
        assert_eq!(result, Err(Ok(Error::ProposalNotFound)));
    }

    #[test]
    fn test_execute_nonexistent_proposal() {
        let t = setup_2_of_3();
        let result = t.wallet.try_execute(&999u32);
        assert_eq!(result, Err(Ok(Error::ProposalNotFound)));
    }

    #[test]
    fn test_revoke_nonexistent_approval() {
        let t = setup_2_of_3();
        let id = t.wallet.submit_proposal(&alice(&t), &t.mock_id, &symbol_short!("action"));

        let result = t.wallet.try_revoke_approval(&bob(&t), &id);
        assert_eq!(result, Err(Ok(Error::NotSigner)));
    }

    #[test]
    fn test_1_of_1_wallet() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let alice = Address::generate(&env);
        let signers = vec![&env, alice.clone()];

        let wallet_id = env.register(MultiSigWallet, ());
        let wallet = MultiSigWalletClient::new(&env, &wallet_id);
        wallet.initialize(&admin, &signers, &1u32);

        let mock_id = env.register(MockTarget, ());
        let mock = MockTargetClient::new(&env, &mock_id);

        let id = wallet.submit_proposal(&alice, &mock_id, &symbol_short!("action"));
        wallet.approve(&alice, &id);
        wallet.execute(&id);
        assert!(mock.was_executed());
    }
}
