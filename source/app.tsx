import React from 'react';
import { useGameState } from './hooks/useGameState.js';
import MainMenuScreen from './components/MainMenuScreen.js';
import BattleScreen from './components/BattleScreen.js';
import ShopScreen from './components/ShopScreen.js';
// Import the missing component
import SellShopScreen from './components/SellShopScreen.js';

export default function App() {
	const { state, setState, moveCommand, selectCommand, changeScene } =
		useGameState();

	switch (state.scene) {
		case 'menu': {
			return (
				<MainMenuScreen state={state} changeScene={changeScene} />
			);
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

		// Add the missing case for 'sell_shop'
		case 'sell_shop': {
			return (
				<SellShopScreen
					state={state}
					setState={setState}
					changeScene={changeScene}
				/>
			);
		}

		// It is also good practice to return null for any unexpected case to satisfy TypeScript
		default: {
			return null;
		}
	}
}