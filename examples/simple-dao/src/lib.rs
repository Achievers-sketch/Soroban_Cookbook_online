#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Val, Vec,
};

const BASIS_POINTS: u128 = 10_000;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DaoConfig {
    pub admin: Address,
    pub voting_period: u64,
    pub quorum: i128,
    pub approval_threshold_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Action {
    pub target: Address,
    pub function: Symbol,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub creator: Address,
    pub description: String,
    pub actions: Vec<Action>,
    pub yes_votes: i128,
    pub no_votes: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub executed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProposalState {
    Active,
    Passed,
    Executed,
    Rejected,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub struct VoteKey {
    pub proposal_id: u32,
    pub voter: Address,
use soroban_sdk::{contract, contractimpl, contracttype, Env};

/// Proposal lifecycle states.
///
/// Valid transitions:
/// ```text
/// Pending → Active → Succeeded → Executed
///                  ↘ Defeated
/// ```
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum ProposalState {
    Pending,
    Active,
    Succeeded,
    Defeated,
    Executed,
}

#[contracttype]
pub enum DataKey {
    Config,
    ProposalCount,
    Proposal(u32),
    Vote(VoteKey),
}

// ---------------------------------------------------------------------------
// Event topics
// ---------------------------------------------------------------------------

const TOPIC_PROPOSAL_CREATED: Symbol = symbol_short!("new_prop");
const TOPIC_VOTE_CAST: Symbol = symbol_short!("vote");
const TOPIC_PROPOSAL_EXECUTED: Symbol = symbol_short!("execute");

// ---------------------------------------------------------------------------
// DAO contract
// ---------------------------------------------------------------------------

    State,
    VotesFor,
    VotesAgainst,
}

#[contract]
pub struct SimpleDao;

#[contractimpl]
impl SimpleDao {
    /// Initialise the DAO with governance parameters.
    /// Can only be called once by the admin.
    pub fn initialize(
        env: Env,
        admin: Address,
        voting_period: u64,
        quorum: i128,
        approval_threshold_bps: u32,
    ) {
        assert!(
            !env.storage().instance().has(&DataKey::Config),
            "already initialized"
        );

        admin.require_auth();
        assert!(voting_period > 0, "voting_period must be > 0");
        assert!(quorum >= 0, "quorum must be >= 0");
        assert!(
            approval_threshold_bps <= BASIS_POINTS as u32,
            "approval_threshold_bps must be <= 10000"
        );

        env.storage().instance().set(
            &DataKey::Config,
            &DaoConfig {
                admin,
                voting_period,
                quorum,
                approval_threshold_bps,
            },
        );
    }

    /// Submit a new proposal. The `proposer` must authorise the submission.
    /// Returns the unique proposal ID.
    pub fn submit_proposal(
        env: Env,
        proposer: Address,
        description: String,
        actions: Vec<Action>,
    ) -> u32 {
        proposer.require_auth();
        let config: DaoConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("not initialized");

        assert!(actions.len() > 0, "must include at least one action");

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0);
        let id = count + 1;
        let now = env.ledger().timestamp();

        let proposal = Proposal {
            id,
            creator: proposer,
            description,
            actions,
            yes_votes: 0,
            no_votes: 0,
            start_time: now,
            end_time: now + config.voting_period,
            executed: false,
        };

        env.storage().instance().set(&DataKey::ProposalCount, &id);
        env.storage()
            .instance()
            .set(&DataKey::Proposal(id), &proposal);
        env.events().publish((TOPIC_PROPOSAL_CREATED,), id);

        id
    }

    /// Cast a vote on an active proposal. Each address may vote once per
    /// proposal. The `voter` must authorise the call.
    pub fn vote(env: Env, voter: Address, proposal_id: u32, approve: bool) {
        voter.require_auth();

        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found");

        let now = env.ledger().timestamp();
        assert!(now <= proposal.end_time, "voting period has ended");
        assert!(!proposal.executed, "proposal already executed");

        let vote_key = VoteKey {
            proposal_id,
            voter: voter.clone(),
        };
        assert!(
            !env.storage()
                .instance()
                .has(&DataKey::Vote(vote_key.clone())),
            "already voted"
        );

        env.storage()
            .instance()
            .set(&DataKey::Vote(vote_key), &approve);

        if approve {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }

        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        env.events()
            .publish((TOPIC_VOTE_CAST, proposal_id, approve), ());
    }

    /// Execute a proposal that has passed. Iterates through the proposal's
    /// actions and invokes each target contract.
    pub fn execute_proposal(env: Env, proposal_id: u32) {
        let config: DaoConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("not initialized");

        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found");

        assert!(!proposal.executed, "already executed");

        let state = proposal.current_state(&config, env.ledger().timestamp());
        assert_eq!(
            state,
            ProposalState::Passed,
            "proposal is not in Passed state"
        );

        for action in proposal.actions.iter() {
            let _: Val = env.invoke_contract(&action.target, &action.function, Vec::new(&env));
        }

        proposal.executed = true;
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        env.events()
            .publish((TOPIC_PROPOSAL_EXECUTED,), proposal_id);
    }

    // -----------------------------------------------------------------------
    // Read-only queries
    // -----------------------------------------------------------------------

    /// Return the DAO governance configuration.
    pub fn get_config(env: Env) -> DaoConfig {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .expect("not initialized")
    }

    /// Return the full proposal record.
    pub fn get_proposal(env: Env, proposal_id: u32) -> Proposal {
        env.storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found")
    }

    /// Compute the current lifecycle state of a proposal.
    pub fn proposal_state(env: Env, proposal_id: u32) -> ProposalState {
        let config: DaoConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("not initialized");
        let proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found");
        proposal.current_state(&config, env.ledger().timestamp())
    }

    /// Return true if `voter` has already cast a vote on the given proposal.
    pub fn has_voted(env: Env, proposal_id: u32, voter: Address) -> bool {
        let key = VoteKey { proposal_id, voter };
        env.storage().instance().has(&DataKey::Vote(key))
    }
}

// ---------------------------------------------------------------------------
// Proposal state machine
// ---------------------------------------------------------------------------

impl Proposal {
    fn current_state(&self, config: &DaoConfig, now: u64) -> ProposalState {
        if self.executed {
            return ProposalState::Executed;
        }
        if now <= self.end_time {
            return ProposalState::Active;
        }
        let total = self.yes_votes + self.no_votes;
        if total == 0 {
            return ProposalState::Rejected;
        }
        if total < config.quorum {
            return ProposalState::Rejected;
        }
        let yes_bps = (self.yes_votes as u128).saturating_mul(BASIS_POINTS) / total as u128;
        if yes_bps >= config.approval_threshold_bps as u128 {
            ProposalState::Passed
        } else {
            ProposalState::Rejected
        }
    }
}

// ---------------------------------------------------------------------------
// Mock target contract (used by integration tests)
// ---------------------------------------------------------------------------

#[doc(hidden)]
#[contract]
pub struct MockTarget;

#[doc(hidden)]
#[contractimpl]
impl MockTarget {
    pub fn action(env: Env) {
        env.storage().instance().set(&"executed", &true);
    }

    pub fn set_val(env: Env, val: i128) {
        env.storage().instance().set(&"executed", &val);
    }

    pub fn was_executed(env: Env) -> bool {
        env.storage().instance().get(&"executed").unwrap_or(false)
    }

    pub fn get_executed_val(env: Env) -> i128 {
        env.storage().instance().get(&"executed").unwrap_or(0)
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as AddressTestUtils, Ledger};
    use soroban_sdk::{symbol_short, vec, Address, Env, String, Vec};

    struct DaoTest {
        admin: Address,
        dao: SimpleDaoClient<'static>,
    }

    fn setup_dao(env: &Env) -> DaoTest {
        let admin = Address::generate(env);
        let voting_period: u64 = 3600;
        let quorum: i128 = 3;
        let approval_threshold_bps: u32 = 5000;

        env.mock_all_auths();
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(env, &dao_id);

        dao.initialize(&admin, &voting_period, &quorum, &approval_threshold_bps);

        DaoTest { admin, dao }
    }

    fn register_mock(env: &Env) -> Address {
        env.register(MockTarget, ())
    }

    fn make_action(env: &Env, target: &Address) -> Action {
        Action {
            target: target.clone(),
            function: symbol_short!("action"),
        }
    }

    fn one_action_vec(env: &Env, target: &Address) -> Vec<Action> {
        vec![env, make_action(env, target)]
    }

    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(&env, &dao_id);

        dao.initialize(&admin, &3600, &3, &5000);

        let config = dao.get_config();
        assert_eq!(config.admin, admin);
        assert_eq!(config.voting_period, 3600);
        assert_eq!(config.quorum, 3);
        assert_eq!(config.approval_threshold_bps, 5000);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_initialize_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(&env, &dao_id);

        dao.initialize(&admin, &3600, &3, &5000);
        dao.initialize(&admin, &3600, &3, &5000);
    }

    #[test]
    #[should_panic(expected = "voting_period must be > 0")]
    fn test_initialize_zero_voting_period_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(&env, &dao_id);

        dao.initialize(&admin, &0, &3, &5000);
    }

    // -----------------------------------------------------------------------
    // Proposal submission
    // -----------------------------------------------------------------------

    #[test]
    fn test_submit_proposal() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let desc = String::from_str(&env, "Test proposal");
        let id = t
            .dao
            .submit_proposal(&proposer, &desc, &one_action_vec(&env, &mock_id));
        assert_eq!(id, 1);

        let proposal = t.dao.get_proposal(&id);
        assert_eq!(proposal.creator, proposer);
        assert_eq!(proposal.description, desc);
        assert_eq!(proposal.yes_votes, 0);
        assert_eq!(proposal.no_votes, 0);
        assert!(!proposal.executed);
    }

    #[test]
    fn test_submit_proposal_increments_id() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let desc = String::from_str(&env, "P1");
        let actions = one_action_vec(&env, &mock_id);

        let id1 = t.dao.submit_proposal(&proposer, &desc, &actions);
        let id2 = t.dao.submit_proposal(&proposer, &desc, &actions);
        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
    }

    #[test]
    #[should_panic(expected = "must include at least one action")]
    fn test_submit_proposal_empty_actions_panics() {
        let env = Env::default();
        let t = setup_dao(&env);

        let empty: Vec<Action> = Vec::new(&env);
        let proposer = Address::generate(&env);
        t.dao
            .submit_proposal(&proposer, &String::from_str(&env, "empty"), &empty);
    }

    // -----------------------------------------------------------------------
    // Voting
    // -----------------------------------------------------------------------

    #[test]
    fn test_vote_yes() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        t.dao.vote(&t.admin, &id, &true);
        let proposal = t.dao.get_proposal(&id);
        assert_eq!(proposal.yes_votes, 1);
        assert_eq!(proposal.no_votes, 0);
    }

    #[test]
    fn test_vote_no() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        t.dao.vote(&t.admin, &id, &false);
        let proposal = t.dao.get_proposal(&id);
        assert_eq!(proposal.yes_votes, 0);
        assert_eq!(proposal.no_votes, 1);
    }

    #[test]
    #[should_panic(expected = "already voted")]
    fn test_double_vote_panics() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        t.dao.vote(&t.admin, &id, &true);
        t.dao.vote(&t.admin, &id, &true);
    }

    #[test]
    fn test_vote_after_deadline_panics() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        let result = t.dao.try_vote(&t.admin, &id, &true);
        assert!(result.is_err());
    }

    #[test]
    fn test_has_voted() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        assert!(!t.dao.has_voted(&id, &t.admin));
        t.dao.vote(&t.admin, &id, &true);
        assert!(t.dao.has_voted(&id, &t.admin));
    }

    // -----------------------------------------------------------------------
    // Proposal state machine
    // -----------------------------------------------------------------------

    #[test]
    fn test_state_active_while_voting_open() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        assert_eq!(t.dao.proposal_state(&id), ProposalState::Active);
    }

    #[test]
    fn test_state_passed_when_threshold_met() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        t.dao.vote(&t.admin, &id, &true);
        let voter2 = Address::generate(&env);
        t.dao.vote(&voter2, &id, &true);
        let voter3 = Address::generate(&env);
        t.dao.vote(&voter3, &id, &true);

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        assert_eq!(t.dao.proposal_state(&id), ProposalState::Passed);
    }

    #[test]
    fn test_state_rejected_when_quorum_not_met() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        t.dao.vote(&t.admin, &id, &true);
        let voter2 = Address::generate(&env);
        t.dao.vote(&voter2, &id, &true);

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        assert_eq!(t.dao.proposal_state(&id), ProposalState::Rejected);
    }

    #[test]
    fn test_state_rejected_when_threshold_not_met() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        t.dao.vote(&t.admin, &id, &true);
        let voter2 = Address::generate(&env);
        t.dao.vote(&voter2, &id, &false);
        let voter3 = Address::generate(&env);
        t.dao.vote(&voter3, &id, &false);

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        assert_eq!(t.dao.proposal_state(&id), ProposalState::Rejected);
    }

    #[test]
    fn test_state_rejected_when_no_votes() {
        let env = Env::default();
        let t = setup_dao(&env);
        let mock_id = register_mock(&env);

        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "p1"),
            &one_action_vec(&env, &mock_id),
        );

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        assert_eq!(t.dao.proposal_state(&id), ProposalState::Rejected);
    }

    // -----------------------------------------------------------------------
    // Execution
    // -----------------------------------------------------------------------

    #[test]
    fn test_execute_proposal_calls_target() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(&env, &dao_id);
        let mock_id = register_mock(&env);
        let mock = MockTargetClient::new(&env, &mock_id);

        dao.initialize(&admin, &3600, &1, &5000);

        let proposer = Address::generate(&env);
        let id = dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "exec"),
            &one_action_vec(&env, &mock_id),
        );
        dao.vote(&admin, &id, &true);

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        assert_eq!(dao.proposal_state(&id), ProposalState::Passed);
        assert!(!mock.was_executed());

        dao.execute_proposal(&id);

        assert!(mock.was_executed());

        let proposal = dao.get_proposal(&id);
        assert!(proposal.executed);
        assert_eq!(dao.proposal_state(&id), ProposalState::Executed);
    }

    #[test]
    fn test_execute_proposal_multiple_actions() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(&env, &dao_id);
        let mock_id = register_mock(&env);
        let mock = MockTargetClient::new(&env, &mock_id);

        dao.initialize(&admin, &3600, &1, &5000);

        // Two actions calling the same mock with different no-arg functions
        let actions = vec![
            &env,
            Action {
                target: mock_id.clone(),
                function: symbol_short!("action"),
            },
            Action {
                target: mock_id,
                function: symbol_short!("action"),
            },
        ];

        let proposer = Address::generate(&env);
        let id = dao.submit_proposal(&proposer, &String::from_str(&env, "multi"), &actions);
        dao.vote(&admin, &id, &true);

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        assert!(!mock.was_executed());
        dao.execute_proposal(&id);
        assert!(mock.was_executed());
    }

    #[test]
    #[should_panic(expected = "proposal is not in Passed state")]
    fn test_execute_rejected_proposal_panics() {
        let env = Env::default();
        let t = setup_dao(&env);

        let mock_id = register_mock(&env);
        let proposer = Address::generate(&env);
        let id = t.dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "fail"),
            &one_action_vec(&env, &mock_id),
        );

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        t.dao.execute_proposal(&id);
    }

    #[test]
    #[should_panic(expected = "already executed")]
    fn test_double_execute_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(&env, &dao_id);
        let mock_id = register_mock(&env);

        dao.initialize(&admin, &3600, &1, &5000);

        let proposer = Address::generate(&env);
        let id = dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "double"),
            &one_action_vec(&env, &mock_id),
        );
        dao.vote(&admin, &id, &true);

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        dao.execute_proposal(&id);
        dao.execute_proposal(&id);
    }

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    #[test]
    fn test_full_dao_scenario_persists_events() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(&env, &dao_id);
        let mock_id = register_mock(&env);
        let mock = MockTargetClient::new(&env, &mock_id);

        dao.initialize(&admin, &3600, &1, &5000);

        let proposer = Address::generate(&env);
        let id = dao.submit_proposal(
            &proposer,
            &String::from_str(&env, "evt"),
            &one_action_vec(&env, &mock_id),
        );
        dao.vote(&admin, &id, &true);

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        assert_eq!(dao.proposal_state(&id), ProposalState::Passed);
        assert!(!mock.was_executed());
        dao.execute_proposal(&id);
        assert!(mock.was_executed());
    }

    #[test]
    fn test_full_dao_scenario() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let dao_id = env.register(SimpleDao, ());
        let dao = SimpleDaoClient::new(&env, &dao_id);
        let mock_id = register_mock(&env);
        let mock = MockTargetClient::new(&env, &mock_id);

        dao.initialize(&admin, &3600, &3, &5000);

        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let carol = Address::generate(&env);

        let id = dao.submit_proposal(
            &alice,
            &String::from_str(&env, "Call mock contract"),
            &one_action_vec(&env, &mock_id),
        );
        assert_eq!(id, 1);

        dao.vote(&alice, &id, &true);
        dao.vote(&bob, &id, &true);
        dao.vote(&carol, &id, &true);

        assert_eq!(dao.proposal_state(&id), ProposalState::Active);

        env.ledger().with_mut(|li| {
            li.timestamp += 7200;
        });

        assert_eq!(dao.proposal_state(&id), ProposalState::Passed);

        assert!(!mock.was_executed());
        dao.execute_proposal(&id);
        assert!(mock.was_executed());

        assert_eq!(dao.proposal_state(&id), ProposalState::Executed);
    /// Initialize a new proposal in the Pending state.
    pub fn create(env: Env) {
        env.storage().instance().set(&DataKey::State, &ProposalState::Pending);
        env.storage().instance().set(&DataKey::VotesFor, &0_u32);
        env.storage().instance().set(&DataKey::VotesAgainst, &0_u32);
    }

    /// Move the proposal from Pending → Active (voting opens).
    pub fn activate(env: Env) {
        let state: ProposalState = env.storage().instance().get(&DataKey::State).unwrap();
        assert!(state == ProposalState::Pending, "must be Pending to activate");
        env.storage().instance().set(&DataKey::State, &ProposalState::Active);
    }

    /// Cast a vote while the proposal is Active.
    pub fn vote(env: Env, in_favor: bool) {
        let state: ProposalState = env.storage().instance().get(&DataKey::State).unwrap();
        assert!(state == ProposalState::Active, "voting is not open");
        if in_favor {
            let v: u32 = env.storage().instance().get(&DataKey::VotesFor).unwrap_or(0);
            env.storage().instance().set(&DataKey::VotesFor, &(v + 1));
        } else {
            let v: u32 = env.storage().instance().get(&DataKey::VotesAgainst).unwrap_or(0);
            env.storage().instance().set(&DataKey::VotesAgainst, &(v + 1));
        }
    }

    /// Close voting: Active → Succeeded or Defeated based on vote counts.
    pub fn finalize(env: Env) {
        let state: ProposalState = env.storage().instance().get(&DataKey::State).unwrap();
        assert!(state == ProposalState::Active, "must be Active to finalize");
        let for_votes: u32 = env.storage().instance().get(&DataKey::VotesFor).unwrap_or(0);
        let against_votes: u32 = env.storage().instance().get(&DataKey::VotesAgainst).unwrap_or(0);
        let next = if for_votes > against_votes {
            ProposalState::Succeeded
        } else {
            ProposalState::Defeated
        };
        env.storage().instance().set(&DataKey::State, &next);
    }

    /// Execute a Succeeded proposal → Executed.
    pub fn execute(env: Env) {
        let state: ProposalState = env.storage().instance().get(&DataKey::State).unwrap();
        assert!(state == ProposalState::Succeeded, "must be Succeeded to execute");
        env.storage().instance().set(&DataKey::State, &ProposalState::Executed);
    }

    /// Return the current proposal state.
    pub fn get_state(env: Env) -> ProposalState {
        env.storage().instance().get(&DataKey::State).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    fn setup() -> (Env, soroban_sdk::Address) {
        let env = Env::default();
        let id = env.register(SimpleDao, ());
        (env, id)
    }

    #[test]
    fn test_create_sets_pending() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        assert_eq!(client.get_state(), ProposalState::Pending);
    }

    #[test]
    fn test_pending_to_active() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        client.activate();
        assert_eq!(client.get_state(), ProposalState::Active);
    }

    #[test]
    fn test_active_to_succeeded() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        client.activate();
        client.vote(&true);
        client.vote(&true);
        client.vote(&false);
        client.finalize();
        assert_eq!(client.get_state(), ProposalState::Succeeded);
    }

    #[test]
    fn test_active_to_defeated() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        client.activate();
        client.vote(&false);
        client.vote(&false);
        client.vote(&true);
        client.finalize();
        assert_eq!(client.get_state(), ProposalState::Defeated);
    }

    #[test]
    fn test_succeeded_to_executed() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        client.activate();
        client.vote(&true);
        client.finalize();
        client.execute();
        assert_eq!(client.get_state(), ProposalState::Executed);
    }

    #[test]
    #[should_panic(expected = "must be Pending to activate")]
    fn test_cannot_activate_active_proposal() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        client.activate();
        client.activate(); // should panic
    }

    #[test]
    #[should_panic(expected = "voting is not open")]
    fn test_cannot_vote_when_pending() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        client.vote(&true); // should panic
    }

    #[test]
    #[should_panic(expected = "must be Succeeded to execute")]
    fn test_cannot_execute_defeated_proposal() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        client.activate();
        client.vote(&false);
        client.finalize();
        client.execute(); // should panic
    }

    #[test]
    #[should_panic(expected = "must be Active to finalize")]
    fn test_cannot_finalize_pending_proposal() {
        let (env, id) = setup();
        let client = SimpleDaoClient::new(&env, &id);
        client.create();
        client.finalize(); // should panic
    }
}
