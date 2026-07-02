#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, vec, Address, Env, Symbol, Vec};

/// A simple contract that will be deployed as child instances by the factory
#[contract]
pub struct ChildContract;

#[contractimpl]
impl ChildContract {
    /// Initialize a child contract with a name
    pub fn init(env: Env, name: Symbol) {
        env.storage().instance().set(&symbol_short!("name"), &name);
    }

    /// Get the name of this child contract
    pub fn get_name(env: Env) -> Symbol {
        env.storage()
            .instance()
            .get(&symbol_short!("name"))
            .unwrap_or(Symbol::new(&env, "unnamed"))
    }

    /// Get metadata about this child contract
    pub fn get_info(env: Env) -> (Symbol, Address) {
        let name = env
            .storage()
            .instance()
            .get(&symbol_short!("name"))
            .unwrap_or(Symbol::new(&env, "unnamed"));
        let contract_id = env.current_contract_address();
        (name, contract_id)
    }
}

/// Factory contract that deploys multiple child contract instances
#[contract]
pub struct ContractFactory;

#[contractimpl]
impl ContractFactory {
    /// Deploy a new child contract instance
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `name` - The name for the child contract instance
    ///
    /// # Returns
    /// The address of the newly deployed child contract
    pub fn deploy_child(env: Env, name: Symbol) -> Address {
        // Get the child contract's WASM code
        let child_code = env.deployer().get_programm_id(&symbol_short!("child"));

        // Deploy a new instance with a unique salt based on the name
        let salt = env.storage().temporary().get::<(), u64>(&()).unwrap_or(0);
        env.storage()
            .temporary()
            .set(&(), &(salt + 1));

        let salt_bytes = salt.to_le_bytes().to_vec();

        let child_address = env
            .deployer()
            .deploy_contract(&salt_bytes, &child_code, Address::from_contract_id(&env.current_contract_address()));

        // Track deployed contracts
        let mut deployed: Vec<Address> = env
            .storage()
            .persistent()
            .get(&symbol_short!("deployed"))
            .unwrap_or_else(|| vec![&env]);

        deployed.push_back(child_address.clone());
        env.storage()
            .persistent()
            .set(&symbol_short!("deployed"), &deployed);

        child_address
    }

    /// Get the list of all deployed child contracts
    pub fn get_deployed_children(env: Env) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&symbol_short!("deployed"))
            .unwrap_or_else(|| vec![&env])
    }

    /// Get the count of deployed child contracts
    pub fn child_count(env: Env) -> u32 {
        let deployed: Vec<Address> = env
            .storage()
            .persistent()
            .get(&symbol_short!("deployed"))
            .unwrap_or_else(|| vec![&env]);
        deployed.len() as u32
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{Env, Symbol};

    #[test]
    fn test_child_contract_init_and_get_name() {
        let env = Env::default();
        let child_contract_id = env.register_contract(None, ChildContract);
        let client = ChildContractClient::new(&env, &child_contract_id);

        let name = Symbol::new(&env, "test-child");
        client.init(&name);

        assert_eq!(client.get_name(), name);
    }

    #[test]
    fn test_child_contract_get_info() {
        let env = Env::default();
        let child_contract_id = env.register_contract(None, ChildContract);
        let client = ChildContractClient::new(&env, &child_contract_id);

        let name = Symbol::new(&env, "info-test");
        client.init(&name);

        let (returned_name, returned_address) = client.get_info();
        assert_eq!(returned_name, name);
        assert_eq!(returned_address, child_contract_id);
    }

    #[test]
    fn test_factory_deploy_child() {
        let env = Env::default();
        let factory_contract_id = env.register_contract(None, ContractFactory);
        let factory_client = ContractFactoryClient::new(&env, &factory_contract_id);

        // Deploy first child
        let name1 = Symbol::new(&env, "child-1");
        let child1_address = factory_client.deploy_child(&name1);
        assert_ne!(child1_address, factory_contract_id);

        // Verify it was tracked
        assert_eq!(factory_client.child_count(), 1);
    }

    #[test]
    fn test_factory_deploy_multiple_children() {
        let env = Env::default();
        let factory_contract_id = env.register_contract(None, ContractFactory);
        let factory_client = ContractFactoryClient::new(&env, &factory_contract_id);

        // Deploy multiple children
        let child1_address = factory_client.deploy_child(&Symbol::new(&env, "child-1"));
        let child2_address = factory_client.deploy_child(&Symbol::new(&env, "child-2"));
        let child3_address = factory_client.deploy_child(&Symbol::new(&env, "child-3"));

        // Verify all children are tracked
        assert_eq!(factory_client.child_count(), 3);

        let deployed = factory_client.get_deployed_children();
        assert_eq!(deployed.len(), 3);
        assert!(deployed.contains(&child1_address));
        assert!(deployed.contains(&child2_address));
        assert!(deployed.contains(&child3_address));
    }

    #[test]
    fn test_factory_children_are_unique() {
        let env = Env::default();
        let factory_contract_id = env.register_contract(None, ContractFactory);
        let factory_client = ContractFactoryClient::new(&env, &factory_contract_id);

        // Deploy children with different names
        let child1 = factory_client.deploy_child(&Symbol::new(&env, "alice"));
        let child2 = factory_client.deploy_child(&Symbol::new(&env, "bob"));

        // Verify they have different addresses
        assert_ne!(child1, child2);
    }

    #[test]
    fn test_factory_child_count_increments() {
        let env = Env::default();
        let factory_contract_id = env.register_contract(None, ContractFactory);
        let factory_client = ContractFactoryClient::new(&env, &factory_contract_id);

        assert_eq!(factory_client.child_count(), 0);

        factory_client.deploy_child(&Symbol::new(&env, "child-1"));
        assert_eq!(factory_client.child_count(), 1);

        factory_client.deploy_child(&Symbol::new(&env, "child-2"));
        assert_eq!(factory_client.child_count(), 2);

        factory_client.deploy_child(&Symbol::new(&env, "child-3"));
        assert_eq!(factory_client.child_count(), 3);
    }
}
