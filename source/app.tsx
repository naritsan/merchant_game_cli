import React from 'react';
import { useGameState } from './hooks/useGameState.js';
import MainMenuScreen from './components/MainMenuScreen.js';
import BattleScreen from './components/BattleScreen.js';
import ShopScreen from './components/ShopScreen.js';
import ShopSetupScreen from './components/ShopSetupScreen.js';
import SellShopScreen from './components/SellShopScreen.js';

export default function App() {
	const { state, setState, moveCommand, selectCommand, changeScene } =
		useGameState();

	switch (state.scene) {
		case 'menu': {
			return <MainMenuScreen state={state} changeScene={changeScene} />;
		}

		case 'battle': {
			return (
				<BattleScreen
					state={state}
					moveCommand={moveCommand}
					selectCommand={selectCommand}
					changeScene={changeScene}
				/>
			);
		}

		case 'shop': {
			return (
				<ShopScreen
					state={state}
					setState={setState}
					changeScene={changeScene}
				/>
			);
		}

		case 'sell_shop': {
			return (
				<SellShopScreen
					state={state}
					setState={setState}
					changeScene={changeScene}
				/>
			);
		}

		case 'shop_setup': {
			return (
				<ShopSetupScreen
					state={state}
					setState={setState}
					changeScene={changeScene}
				/>
			);
		}

		// No default
	}
}