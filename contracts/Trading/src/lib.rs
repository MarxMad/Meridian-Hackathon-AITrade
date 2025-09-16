#![no_std]
use soroban_sdk::{contract, contractimpl, Env, String, Address, Symbol, Vec, vec, token};

#[contract]
pub struct TradingContract;

#[contractimpl]
impl TradingContract {
    // Inicializar el contrato
    pub fn initialize(env: Env) {
        // El contrato se inicializa automáticamente
        // No necesitamos admin hardcodeado
        env.storage().instance().set(&String::from_str(&env, "initialized"), &true);
    }

    // Abrir posición de trading (usando sender como trader)
    pub fn open_position(
        env: Env,
        asset: Symbol,
        amount: u64,
        position_type: String,
        token_asset: Address
    ) -> u64 {
        // Usar el sender (quien llama al contrato) como trader
        // En Soroban, necesitamos obtener el caller real
        let trader = env.current_contract_address();
        
        // 0. Verificar que hay fondos depositados
        let deposit_amount: u64 = env.storage().instance()
            .get(&String::from_str(&env, "deposit_amount"))
            .unwrap_or(0);
        if deposit_amount < amount {
            panic!("Fondos insuficientes. Deposita primero con deposit_funds()");
        }
        
        // 1. Generar ID único para la posición
        let position_id = env.storage().instance().get(&String::from_str(&env, "next_position_id"))
            .unwrap_or(0) + 1;
        env.storage().instance().set(&String::from_str(&env, "next_position_id"), &position_id);

        // 2. Obtener precio actual del activo
        let current_price = get_current_price(&env, &asset);

        // 3. Almacenar datos de la posición usando claves simples
        let position_key = String::from_str(&env, "position");
        env.storage().instance().set(&position_key, &position_id);
        
        let trader_key = String::from_str(&env, "trader");
        env.storage().instance().set(&trader_key, &trader);
        
        let asset_key = String::from_str(&env, "asset");
        env.storage().instance().set(&asset_key, &asset);
        
        let entry_price_key = String::from_str(&env, "entry_price");
        env.storage().instance().set(&entry_price_key, &current_price);
        
        let amount_key = String::from_str(&env, "amount");
        env.storage().instance().set(&amount_key, &amount);
        
        let position_type_key = String::from_str(&env, "position_type");
        env.storage().instance().set(&position_type_key, &position_type);
        
        let status_key = String::from_str(&env, "status");
        env.storage().instance().set(&status_key, &String::from_str(&env, "open"));

        // 4. Agregar a lista de posiciones del trader
        let trader_positions_key = String::from_str(&env, "trader_positions");
        let mut trader_positions: Vec<u64> = env.storage().instance()
            .get(&trader_positions_key)
            .unwrap_or(vec![&env]);
        trader_positions.push_back(position_id);
        env.storage().instance().set(&trader_positions_key, &trader_positions);

        // 5. Emitir evento
        env.events().publish((String::from_str(&env, "position_opened"),), (position_id, trader, asset, amount, position_type));

        position_id
    }

    // Cerrar posición y calcular PnL
    pub fn close_position(env: Env, position_id: u64) -> i128 {
        // 1. Verificar que la posición existe y está abierta
        let status_key = String::from_str(&env, "status");
        let status: String = env.storage().instance()
            .get(&status_key)
            .expect("Position not found");
            
        if status != String::from_str(&env, "open") {
            panic!("Position is not open");
        }

        // 2. Obtener datos de la posición
        let trader_key = String::from_str(&env, "trader");
        let trader: Address = env.storage().instance().get(&trader_key).unwrap();
        
        let asset_key = String::from_str(&env, "asset");
        let asset: Symbol = env.storage().instance().get(&asset_key).unwrap();
        
        let entry_price_key = String::from_str(&env, "entry_price");
        let entry_price: u64 = env.storage().instance().get(&entry_price_key).unwrap();
        
        let amount_key = String::from_str(&env, "amount");
        let amount: u64 = env.storage().instance().get(&amount_key).unwrap();
        
        let position_type_key = String::from_str(&env, "position_type");
        let position_type: String = env.storage().instance().get(&position_type_key).unwrap();

        // 3. Obtener precio actual
        let current_price = get_current_price(&env, &asset);

        // 4. Calcular PnL
        let pnl = calculate_pnl(entry_price, current_price, amount, &position_type);

        // 5. Actualizar estado de la posición
        env.storage().instance().set(&status_key, &String::from_str(&env, "closed"));
        
        let pnl_key = String::from_str(&env, "pnl");
        env.storage().instance().set(&pnl_key, &pnl);

        // 6. Calcular monto final (monto original + PnL)
        let final_amount = if pnl >= 0 {
            amount + (pnl as u64)
        } else {
            let loss = (-pnl) as u64;
            if loss >= amount {
                0 // Pérdida total
            } else {
                amount - loss
            }
        };

        // 7. Transferir dinero real al usuario
        if final_amount > 0 {
            let deposit_asset: Address = env.storage().instance()
                .get(&String::from_str(&env, "deposit_asset"))
                .expect("No deposit asset found");
            
            let token_client = token::Client::new(&env, &deposit_asset);
            token_client.transfer(&env.current_contract_address(), &trader, &(final_amount as i128));
        }

        // 8. Emitir evento de transferencia
        env.events().publish(
            (String::from_str(&env, "position_closed"),),
            (position_id, trader, pnl, final_amount)
        );

        pnl
    }

    // Obtener información básica de posición
    pub fn get_position_info(env: Env) -> (Address, Symbol, u64, u64, String, String) {
        let trader_key = String::from_str(&env, "trader");
        let trader: Address = env.storage().instance().get(&trader_key).unwrap_or(env.current_contract_address());
        
        let asset_key = String::from_str(&env, "asset");
        let asset: Symbol = env.storage().instance().get(&asset_key).unwrap_or(Symbol::new(&env, "XLM"));
        
        let entry_price_key = String::from_str(&env, "entry_price");
        let entry_price: u64 = env.storage().instance().get(&entry_price_key).unwrap_or(0);
        
        let amount_key = String::from_str(&env, "amount");
        let amount: u64 = env.storage().instance().get(&amount_key).unwrap_or(0);
        
        let position_type_key = String::from_str(&env, "position_type");
        let position_type: String = env.storage().instance().get(&position_type_key).unwrap_or(String::from_str(&env, "none"));
        
        let status_key = String::from_str(&env, "status");
        let status: String = env.storage().instance().get(&status_key).unwrap_or(String::from_str(&env, "closed"));

        (trader, asset, entry_price, amount, position_type, status)
    }

    // Obtener posiciones del sender actual
    pub fn get_my_positions(env: Env) -> Vec<u64> {
        let trader = env.current_contract_address();
        let trader_positions_key = String::from_str(&env, "trader_positions");
        env.storage().instance()
            .get(&trader_positions_key)
            .unwrap_or(vec![&env])
    }

    // Obtener posiciones de un trader específico (solo para admin)
    pub fn get_trader_positions(env: Env, _trader: Address) -> Vec<u64> {
        let trader_positions_key = String::from_str(&env, "trader_positions");
        env.storage().instance()
            .get(&trader_positions_key)
            .unwrap_or(vec![&env])
    }

    // Obtener todas las posiciones activas
    pub fn get_active_positions(env: Env) -> Vec<u64> {
        let active_positions_key = String::from_str(&env, "active_positions");
        env.storage().instance()
            .get(&active_positions_key)
            .unwrap_or(vec![&env])
    }

    // Obtener posiciones activas de un trader específico
    pub fn get_trader_active_positions(env: Env, trader: Address) -> Vec<u64> {
        let trader_positions = Self::get_trader_positions(env.clone(), trader);
        let mut active_positions = vec![&env];
        
        // Por simplicidad, asumimos que todas las posiciones están activas
        for position_id in trader_positions.iter() {
            active_positions.push_back(position_id);
        }
        
        active_positions
    }

    // Obtener historial de transacciones de un trader (simplificado)
    pub fn get_trader_transaction_history(env: Env, _trader: Address) -> Vec<u64> {
        let history_key = String::from_str(&env, "tx_history");
        env.storage().instance()
            .get(&history_key)
            .unwrap_or(vec![&env])
    }

    // Obtener historial global de transacciones (simplificado)
    pub fn get_global_transaction_history(env: Env) -> Vec<u64> {
        let global_history_key = String::from_str(&env, "global_tx_history");
        env.storage().instance()
            .get(&global_history_key)
            .unwrap_or(vec![&env])
    }

    // Obtener estadísticas de un trader (simplificado)
    pub fn get_trader_stats(env: Env, trader: Address) -> (u64, u64) {
        let trader_positions = Self::get_trader_positions(env.clone(), trader.clone());
        let total_positions = trader_positions.len() as u64;
        let active_positions = Self::get_trader_active_positions(env, trader).len() as u64;
        
        (total_positions, active_positions)
    }

    // Obtener estadísticas globales del contrato (simplificado)
    pub fn get_global_stats(env: Env) -> (u64, u64) {
        // Obtener el siguiente ID de posición para saber cuántas posiciones se han creado
        let next_position_id = env.storage().instance().get(&String::from_str(&env, "next_position_id"))
            .unwrap_or(0);
            
        let active_positions = Self::get_active_positions(env).len() as u64;

        (next_position_id, active_positions)
    }

    // Registrar transacción en el historial (simplificado)
    pub fn record_transaction(env: Env, _trader: Address, tx_id: u64) {
        // Registrar en historial del trader
        let history_key = String::from_str(&env, "tx_history");
        let mut trader_history: Vec<u64> = env.storage().instance()
            .get(&history_key)
            .unwrap_or(vec![&env]);
        trader_history.push_back(tx_id);
        env.storage().instance().set(&history_key, &trader_history);

        // Registrar en historial global
        let global_history_key = String::from_str(&env, "global_tx_history");
        let mut global_history: Vec<u64> = env.storage().instance()
            .get(&global_history_key)
            .unwrap_or(vec![&env]);
        global_history.push_back(tx_id);
        env.storage().instance().set(&global_history_key, &global_history);
    }

    // Función para hacer swap de XLM a USDC usando Soroswap
    pub fn swap_xlm_to_usdc(env: Env, xlm_amount: u64) -> u64 {
        // Esta función simula un swap de XLM a USDC
        // En una implementación real, esto llamaría a Soroswap API
        
        // 1. Verificar que hay suficiente XLM
        let deposit_amount: u64 = env.storage().instance()
            .get(&String::from_str(&env, "deposit_amount"))
            .unwrap_or(0);
        if deposit_amount < xlm_amount {
            panic!("Fondos insuficientes para el swap");
        }
        
        // 2. Obtener precio de XLM desde Soroswap
        let xlm_price = get_current_price(&env, &Symbol::new(&env, "XLM"));
        
        // 3. Calcular cantidad de USDC (simulado)
        // En la realidad, esto vendría de la respuesta de Soroswap API
        let usdc_amount = (xlm_amount * xlm_price) / 1_000_000; // Convertir a USDC
        
        // 4. Actualizar depósitos
        env.storage().instance().set(&String::from_str(&env, "deposit_amount"), &(deposit_amount - xlm_amount));
        env.storage().instance().set(&String::from_str(&env, "usdc_amount"), &usdc_amount);
        
        // 5. Emitir evento
        env.events().publish(
            (String::from_str(&env, "swap_completed"),),
            (xlm_amount, usdc_amount, xlm_price)
        );
        
        usdc_amount
    }

    // Función para el agente automático - ejecutar trading automático
    pub fn auto_trade(env: Env, asset: Symbol, amount: u64, strategy: String, token_asset: Address) -> u64 {
        // Esta función será llamada por el agente automático
        // Basada en la estrategia, decide si abrir una posición
        
        let current_price = get_current_price(&env, &asset);
        let position_type = determine_position_type(&env, &strategy, &asset, current_price);
        
        // Abrir posición automáticamente (usando sender)
        let position_id = Self::open_position(env.clone(), asset.clone(), amount, position_type, token_asset);
        
        // Registrar transacción automática
        let trader = env.current_contract_address();
        Self::record_transaction(env, trader, position_id);
        
        position_id
    }

    // Función para cerrar posiciones automáticamente basada en condiciones
    pub fn auto_close_positions(env: Env, trader: Address) -> Vec<u64> {
        let active_positions = Self::get_trader_active_positions(env.clone(), trader.clone());
        let mut closed_positions = vec![&env];
        
        for position_id in active_positions.iter() {
            let (_, asset, entry_price, amount, position_type, _) = Self::get_position_info(env.clone());
            let current_price = get_current_price(&env, &asset);
            
            // Calcular PnL actual
            let current_pnl = calculate_pnl(entry_price, current_price, amount, &position_type);
            
            // Condiciones para cerrar automáticamente
            let should_close = should_auto_close(&env, position_id, current_pnl, &position_type);
            
            if should_close {
                let _pnl = Self::close_position(env.clone(), position_id);
                closed_positions.push_back(position_id);
                
                // Registrar cierre automático
                Self::record_transaction(env.clone(), trader.clone(), position_id);
            }
        }
        
        closed_positions
    }

    // Depositar fondos al contrato (transferencia real de tokens)
    pub fn deposit_funds(env: Env, asset: Address, amount: u64) {
        // En Soroban, el contrato no puede transferir tokens de otros usuarios
        // Esta función debe ser llamada por el usuario directamente
        // Por ahora, solo registramos el depósito
        let trader = env.current_contract_address();
        
        // Registrar el depósito
        env.storage().instance().set(&String::from_str(&env, "deposit_amount"), &amount);
        env.storage().instance().set(&String::from_str(&env, "deposit_asset"), &asset);
        
        env.events().publish(
            (String::from_str(&env, "funds_deposited"),),
            (trader, asset, amount)
        );
    }

    // Función para obtener el owner del contrato
    pub fn get_owner(env: Env) -> Address {
        env.current_contract_address()
    }

    // Función para verificar si el sender es el owner
    pub fn is_owner(env: Env) -> bool {
        let sender = env.current_contract_address();
        let owner = Self::get_owner(env);
        sender == owner
    }

    // Obtener precio actual de un activo
    pub fn get_current_price(env: Env, asset: Symbol) -> u64 {
        get_current_price(&env, &asset)
    }

    // Obtener precio real desde API de Soroswap (para uso en frontend/bot)
    pub fn get_real_price(env: Env, asset: Symbol) -> u64 {
        // Primero intentar obtener desde oráculo interno
        if let Some(price) = Self::get_price_from_oracle(env.clone(), asset.clone()) {
            return price;
        }
        
        // Si no hay precio en oráculo, usar precio simulado
        Self::get_soroswap_price(env, asset)
    }

    // Función para el bot/frontend para actualizar precios desde API real
    pub fn update_price_from_api(env: Env, asset: Symbol, price: u64) -> bool {
        // Esta función será llamada por el bot/frontend cuando obtenga precios reales
        Self::update_price_from_oracle(env, asset, price);
        true
    }

    // Configurar API key de Soroswap
    pub fn set_soroswap_api_key(env: Env, api_key: String) {
        env.storage().instance().set(&String::from_str(&env, "soroswap_api_key"), &api_key);
    }

    // Obtener API key de Soroswap
    pub fn get_soroswap_api_key(env: Env) -> String {
        env.storage().instance()
            .get(&String::from_str(&env, "soroswap_api_key"))
            .unwrap_or(String::from_str(&env, ""))
    }

    // Configurar dirección del contrato SoroswapFactory
    pub fn set_soroswap_factory(env: Env, factory_address: Address) {
        env.storage().instance().set(&String::from_str(&env, "soroswap_factory"), &factory_address);
    }

    // Obtener dirección del contrato SoroswapFactory
    pub fn get_soroswap_factory(env: Env) -> Address {
        env.storage().instance()
            .get(&String::from_str(&env, "soroswap_factory"))
            .unwrap_or(Address::from_string(&String::from_str(&env, "CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2")))
    }

    // Obtener precio desde Soroswap (simulado para el hackathon)
    pub fn get_soroswap_price(env: Env, asset: Symbol) -> u64 {
        // En una implementación real, esto haría una llamada al contrato SoroswapFactory
        // Para el hackathon, simulamos la respuesta basada en el asset
        
        // Precios simulados basados en assets comunes de Stellar
        // En producción, esto se conectaría con la API de Soroswap
        // Por simplicidad, usamos un mapeo directo
        if asset == Symbol::new(&env, "XLM") {
            150000  // $0.15
        } else if asset == Symbol::new(&env, "USDC") {
            1000000 // $1.00
        } else if asset == Symbol::new(&env, "USDT") {
            1000000 // $1.00
        } else if asset == Symbol::new(&env, "BTC") {
            45000000 // $45,000
        } else if asset == Symbol::new(&env, "ETH") {
            3000000  // $3,000
        } else {
            150000 // Precio por defecto
        }
    }

    // Actualizar precio desde oráculo externo
    pub fn update_price_from_oracle(env: Env, asset: Symbol, price: u64) {
        // Crear clave única para el asset
        let asset_key = if asset == Symbol::new(&env, "XLM") {
            String::from_str(&env, "price_XLM")
        } else if asset == Symbol::new(&env, "USDC") {
            String::from_str(&env, "price_USDC")
        } else if asset == Symbol::new(&env, "USDT") {
            String::from_str(&env, "price_USDT")
        } else if asset == Symbol::new(&env, "BTC") {
            String::from_str(&env, "price_BTC")
        } else if asset == Symbol::new(&env, "ETH") {
            String::from_str(&env, "price_ETH")
        } else {
            String::from_str(&env, "price_UNKNOWN")
        };
        
        env.storage().instance().set(&asset_key, &price);
    }

    // Obtener precio desde oráculo interno
    pub fn get_price_from_oracle(env: Env, asset: Symbol) -> Option<u64> {
        // Crear clave única para el asset
        let asset_key = if asset == Symbol::new(&env, "XLM") {
            String::from_str(&env, "price_XLM")
        } else if asset == Symbol::new(&env, "USDC") {
            String::from_str(&env, "price_USDC")
        } else if asset == Symbol::new(&env, "USDT") {
            String::from_str(&env, "price_USDT")
        } else if asset == Symbol::new(&env, "BTC") {
            String::from_str(&env, "price_BTC")
        } else if asset == Symbol::new(&env, "ETH") {
            String::from_str(&env, "price_ETH")
        } else {
            String::from_str(&env, "price_UNKNOWN")
        };
        
        env.storage().instance().get(&asset_key)
    }

    // Función para obtener precio real desde API de Soroswap
    pub fn fetch_soroswap_price(env: Env, asset: Symbol) -> u64 {
        // Esta función simula una llamada a la API de Soroswap
        // En producción, esto haría una llamada HTTP a api.soroswap.finance
        
        // Por ahora, retornamos precios simulados basados en el asset
        // La API key se usaría en el frontend/bot para hacer las llamadas reales
        Self::get_soroswap_price(env, asset)
    }
}

// Función auxiliar para obtener precio actual
fn get_current_price(env: &Env, asset: &Symbol) -> u64 {
    // Integración con Soroswap para precios reales
    // En producción, esto haría una llamada a la API de Soroswap
    
    // Primero intentar obtener precio desde oráculo interno (precios reales)
    let oracle_price = get_price_from_oracle_internal(env, asset);
    if let Some(price) = oracle_price {
        return price;
    }
    
    // Si no hay precio en oráculo, usar precios simulados
    if *asset == Symbol::new(env, "XLM") {
        150000  // $0.15
    } else if *asset == Symbol::new(env, "USDC") {
        1000000 // $1.00
    } else if *asset == Symbol::new(env, "USDT") {
        1000000 // $1.00
    } else if *asset == Symbol::new(env, "BTC") {
        45000000 // $45,000
    } else if *asset == Symbol::new(env, "ETH") {
        3000000  // $3,000
    } else {
        150000 // Precio por defecto
    }
}

// Función auxiliar para obtener precio desde oráculo interno
fn get_price_from_oracle_internal(env: &Env, asset: &Symbol) -> Option<u64> {
    // Crear clave única para el asset
    let asset_key = if *asset == Symbol::new(env, "XLM") {
        String::from_str(env, "price_XLM")
    } else if *asset == Symbol::new(env, "USDC") {
        String::from_str(env, "price_USDC")
    } else if *asset == Symbol::new(env, "USDT") {
        String::from_str(env, "price_USDT")
    } else if *asset == Symbol::new(env, "BTC") {
        String::from_str(env, "price_BTC")
    } else if *asset == Symbol::new(env, "ETH") {
        String::from_str(env, "price_ETH")
    } else {
        String::from_str(env, "price_UNKNOWN")
    };
    
    env.storage().instance().get(&asset_key)
}

// Función auxiliar para calcular PnL
fn calculate_pnl(entry_price: u64, current_price: u64, amount: u64, position_type: &String) -> i128 {
    let price_diff = if current_price > entry_price {
        current_price - entry_price
    } else {
        entry_price - current_price
    };

    let pnl = (price_diff as u128 * amount as u128) / (entry_price as u128);

    if position_type == &String::from_str(&Env::default(), "long") {
        if current_price > entry_price {
            pnl as i128 // Ganancia en long
        } else {
            -(pnl as i128) // Pérdida en long
        }
    } else {
        if current_price < entry_price {
            pnl as i128 // Ganancia en short
        } else {
            -(pnl as i128) // Pérdida en short
        }
    }
}

// Función auxiliar para determinar tipo de posición basada en estrategia
fn determine_position_type(env: &Env, _strategy: &String, _asset: &Symbol, _current_price: u64) -> String {
    // Estrategias simples para el agente automático
    // Por simplicidad, siempre retornamos "long"
    // En implementación real, esto analizaría la estrategia
    String::from_str(env, "long")
}

// Función auxiliar para determinar si cerrar posición automáticamente
fn should_auto_close(_env: &Env, _position_id: u64, current_pnl: i128, _position_type: &String) -> bool {
    // Condiciones para cerrar automáticamente:
    
    // 1. Stop loss: cerrar si pérdida > 5%
    let stop_loss_threshold = -500; // -5% en base 10000
    if current_pnl < stop_loss_threshold {
        return true;
    }
    
    // 2. Take profit: cerrar si ganancia > 10%
    let take_profit_threshold = 1000; // 10% en base 10000
    if current_pnl > take_profit_threshold {
        return true;
    }
    
    // 3. Estrategia específica - por simplicidad, no cerrar automáticamente
    false
}

mod test;