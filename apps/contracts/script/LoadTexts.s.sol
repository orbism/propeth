// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/Fortune721.sol";

/**
 * @title LoadTexts
 * @notice Script to batch-load text fragments from prophet.csv into Fortune721
 * @dev Run with: forge script script/LoadTexts.s.sol --rpc-url <network> --broadcast
 * 
 * IMPORTANT: Update the textData array below with your CSV data before running
 */
contract LoadTexts is Script {
    // Fortune721 contract address (set from env or hardcode)
    address public fortuneAddress;

    function run() external {
        fortuneAddress = vm.envAddress("FORTUNE721_ADDRESS");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        Fortune721 fortune = Fortune721(fortuneAddress);

        console.log("Loading texts into Fortune721 at:", fortuneAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Card 0: The End
        fortune.setFragmentText(0, 1, 0, "No ending is absolute");
        fortune.setFragmentText(0, 1, 1, "The end can be the beginning");
        fortune.setFragmentText(0, 2, 0, "but struggle will come to an end.");
        fortune.setFragmentText(0, 2, 1, "before peace returns.");
        fortune.setFragmentText(0, 3, 0, "The sadness will end.");
        fortune.setFragmentText(0, 3, 1, "Now it's time to reflect.");

        // Card 1: Pain
        fortune.setFragmentText(1, 1, 0, "Pain is teaching you something");
        fortune.setFragmentText(1, 1, 1, "Suffering will make you stronger");
        fortune.setFragmentText(1, 2, 0, "that lies beyond your understanding.");
        fortune.setFragmentText(1, 2, 1, "if you allow it.");
        fortune.setFragmentText(1, 3, 0, "You will find your way.");
        fortune.setFragmentText(1, 3, 1, "Endure to heal.");

        // Card 2: The Future
        fortune.setFragmentText(2, 1, 0, "Tomorrow is a promise");
        fortune.setFragmentText(2, 1, 1, "The future holds your dreams");
        fortune.setFragmentText(2, 2, 0, "waiting to be fulfilled.");
        fortune.setFragmentText(2, 2, 1, "if you dare to reach for them.");
        fortune.setFragmentText(2, 3, 0, "Do not fear what's ahead.");
        fortune.setFragmentText(2, 3, 1, "Embrace the unknown.");

        // Card 3: Love
        fortune.setFragmentText(3, 1, 0, "Love waits in the shadows");
        fortune.setFragmentText(3, 1, 1, "Your heart knows the way");
        fortune.setFragmentText(3, 2, 0, "ready to emerge when you are.");
        fortune.setFragmentText(3, 2, 1, "even when your mind does not.");
        fortune.setFragmentText(3, 3, 0, "Open yourself to connection.");
        fortune.setFragmentText(3, 3, 1, "Trust what you feel.");

        // Card 4: Death
        fortune.setFragmentText(4, 1, 0, "An ending approaches");
        fortune.setFragmentText(4, 1, 1, "Transformation is inevitable");
        fortune.setFragmentText(4, 2, 0, "but it brings renewal.");
        fortune.setFragmentText(4, 2, 1, "and necessary for growth.");
        fortune.setFragmentText(4, 3, 0, "Let go of the old.");
        fortune.setFragmentText(4, 3, 1, "Welcome the new.");

        // Card 5: Mistery
        fortune.setFragmentText(5, 1, 0, "The unknown watches in silence");
        fortune.setFragmentText(5, 1, 1, "Every question hides an answer");
        fortune.setFragmentText(5, 2, 0, "while the unknown waits.");
        fortune.setFragmentText(5, 2, 1, "until it is revealed.");
        fortune.setFragmentText(5, 3, 0, "Don't look away.");
        fortune.setFragmentText(5, 3, 1, "Let curiosity guide you.");

        // Card 6: Change
        fortune.setFragmentText(6, 1, 0, "The wheel turns without pause");
        fortune.setFragmentText(6, 1, 1, "Change is the only constant");
        fortune.setFragmentText(6, 2, 0, "carrying you forward.");
        fortune.setFragmentText(6, 2, 1, "shaping your journey.");
        fortune.setFragmentText(6, 3, 0, "Flow with the current.");
        fortune.setFragmentText(6, 3, 1, "Adapt and evolve.");

        // Card 7: Fate
        fortune.setFragmentText(7, 1, 0, "What's meant to be will find you");
        fortune.setFragmentText(7, 1, 1, "Your path was written long ago");
        fortune.setFragmentText(7, 2, 0, "no matter where you hide.");
        fortune.setFragmentText(7, 2, 1, "but you hold the pen.");
        fortune.setFragmentText(7, 3, 0, "Accept what comes.");
        fortune.setFragmentText(7, 3, 1, "Write your own story.");

        // Card 8: Illusion
        fortune.setFragmentText(8, 1, 0, "What you see is not what is");
        fortune.setFragmentText(8, 1, 1, "Perception shapes reality");
        fortune.setFragmentText(8, 2, 0, "and truth hides in plain sight.");
        fortune.setFragmentText(8, 2, 1, "but reality remains unchanged.");
        fortune.setFragmentText(8, 3, 0, "Look deeper.");
        fortune.setFragmentText(8, 3, 1, "Question everything.");

        // Card 9: Power
        fortune.setFragmentText(9, 1, 0, "Strength flows through you");
        fortune.setFragmentText(9, 1, 1, "You possess untapped potential");
        fortune.setFragmentText(9, 2, 0, "waiting to be unleashed.");
        fortune.setFragmentText(9, 2, 1, "ready to be awakened.");
        fortune.setFragmentText(9, 3, 0, "Claim your power.");
        fortune.setFragmentText(9, 3, 1, "Rise and conquer.");

        // Card 10: The Unknown
        fortune.setFragmentText(10, 1, 0, "Beyond the edge lies mystery");
        fortune.setFragmentText(10, 1, 1, "The void holds infinite possibility");
        fortune.setFragmentText(10, 2, 0, "calling you to explore.");
        fortune.setFragmentText(10, 2, 1, "waiting to be discovered.");
        fortune.setFragmentText(10, 3, 0, "Step into darkness.");
        fortune.setFragmentText(10, 3, 1, "Find what was hidden.");

        // Card 11: Wisdom
        fortune.setFragmentText(11, 1, 0, "Knowledge comes with patience");
        fortune.setFragmentText(11, 1, 1, "The wise see what others miss");
        fortune.setFragmentText(11, 2, 0, "and understanding follows.");
        fortune.setFragmentText(11, 2, 1, "because they listen.");
        fortune.setFragmentText(11, 3, 0, "Seek to learn.");
        fortune.setFragmentText(11, 3, 1, "Observe and understand.");

        // Card 12: Chaos
        fortune.setFragmentText(12, 1, 0, "Disorder breeds creation");
        fortune.setFragmentText(12, 1, 1, "From chaos comes opportunity");
        fortune.setFragmentText(12, 2, 0, "when order fails.");
        fortune.setFragmentText(12, 2, 1, "if you're brave enough.");
        fortune.setFragmentText(12, 3, 0, "Embrace the storm.");
        fortune.setFragmentText(12, 3, 1, "Dance in the madness.");

        // Card 13: Silence
        fortune.setFragmentText(13, 1, 0, "In stillness, truth emerges");
        fortune.setFragmentText(13, 1, 1, "Quiet reveals what noise conceals");
        fortune.setFragmentText(13, 2, 0, "when you stop to listen.");
        fortune.setFragmentText(13, 2, 1, "if you dare to hear it.");
        fortune.setFragmentText(13, 3, 0, "Be still and know.");
        fortune.setFragmentText(13, 3, 1, "Find peace within.");

        // Card 14: Hope
        fortune.setFragmentText(14, 1, 0, "Light persists in darkness");
        fortune.setFragmentText(14, 1, 1, "Even the smallest spark matters");
        fortune.setFragmentText(14, 2, 0, "refusing to be extinguished.");
        fortune.setFragmentText(14, 2, 1, "when all seems lost.");
        fortune.setFragmentText(14, 3, 0, "Never lose faith.");
        fortune.setFragmentText(14, 3, 1, "Keep the flame alive.");

        vm.stopBroadcast();

        console.log("\nSuccessfully loaded all 90 text fragments!");
        console.log("Cards: 0-14");
        console.log("Positions: 1-3");
        console.log("Variants: A & B");
    }
}