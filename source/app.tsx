import React from 'react';
import { Box } from 'ink';
import { useGameState } from './hooks/useGameState.js';
import MainMenuScreen from './components/MainMenuScreen.js';
import BattleScreen from './components/BattleScreen.js';
import ShopScreen from './components/ShopScreen.js';
import ShopSetupScreen from './components/ShopSetupScreen.js';
import SellShopScreen from './components/SellShopScreen.js';
import InventoryScreen from './components/InventoryScreen.js';
import CalendarScreen from './components/CalendarScreen.js';
import FortuneScreen from './components/FortuneScreen.js';
import TipsScreen from './components/TipsScreen.js';
import Header from './components/Header.js';

export default function App() {
	const { state, setState, moveCommand, selectCommand, changeScene, sleep, advanceTime, revealLuck } =
		useGameState();

	const renderScene = () => {
		switch (state.scene) {
			case 'menu': {
				return (
					<MainMenuScreen
						state={state}
						setState={setState}
						changeScene={changeScene}
						sleep={sleep}
						advanceTime={advanceTime}
					/>
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
						advanceTime={advanceTime}
					/>
				);
			}

			case 'sell_shop': {
				return (
					<SellShopScreen
						state={state}
						setState={setState}
						changeScene={changeScene}
						advanceTime={advanceTime}
					/>
				);
			}

			case 'shop_setup': {
				return (
					<ShopSetupScreen
						state={state}
						setState={setState}
						changeScene={changeScene}
						advanceTime={advanceTime}
					/>
				);
			}

			case 'inventory': {
				return <InventoryScreen state={state} changeScene={changeScene} />;
			}

			case 'calendar': {
				return <CalendarScreen state={state} changeScene={changeScene} />;
			}

			case 'fortune': {
				return (
					<FortuneScreen
						state={state}
						changeScene={changeScene}
						revealLuck={revealLuck}
					/>
				);
			}

			case 'tips': {
				return <TipsScreen changeScene={changeScene} />;
			}

			default:
				return null;
		}
	};

	return (
		<Box flexDirection="column">
			<Header state={state} />
			{renderScene()}
		</Box>
	);
}