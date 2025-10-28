// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Fortune721.sol";

contract LoadFortunes is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address fortuneAddress = vm.envAddress("FORTUNE721_ADDRESS");
        
        Fortune721 fortune = Fortune721(fortuneAddress);
        
        vm.startBroadcast(deployerPrivateKey);

        // Card 0: The End
        fortune.setFragmentText(0, 1, 0, "No ending is absolute");
        fortune.setFragmentText(0, 1, 1, "The end can be the beginning");
        fortune.setFragmentText(0, 2, 0, "but struggle will come to an end.");
        fortune.setFragmentText(0, 2, 1, "before peace returns.");
        fortune.setFragmentText(0, 3, 0, "The sadness will end.");
        fortune.setFragmentText(0, 3, 1, "Now it's time to reflect.");

        // Card 1: Suspicion
        fortune.setFragmentText(1, 1, 0, "Not everything is what it seems");
        fortune.setFragmentText(1, 1, 1, "Trust your senses, but keep them sharp");
        fortune.setFragmentText(1, 2, 0, "yet someone will be responsible.");
        fortune.setFragmentText(1, 2, 1, "so you can see through the illusion.");
        fortune.setFragmentText(1, 3, 0, "Find who cast shade on you.");
        fortune.setFragmentText(1, 3, 1, "You will find your answer.");

        // Card 2: Eclipse
        fortune.setFragmentText(2, 1, 0, "Shadows hide what you ignore");
        fortune.setFragmentText(2, 1, 1, "Don't let your emotions cloud what's important");
        fortune.setFragmentText(2, 2, 0, "when you witness the impossible.");
        fortune.setFragmentText(2, 2, 1, "but don't let it cloud your judgement.");
        fortune.setFragmentText(2, 3, 0, "Be aware.");
        fortune.setFragmentText(2, 3, 1, "Pay attention to signs.");

        // Card 3: Tension
        fortune.setFragmentText(3, 1, 0, "The air tightens around your thoughts");
        fortune.setFragmentText(3, 1, 1, "Pressure builds before release");
        fortune.setFragmentText(3, 2, 0, "until something breaks.");
        fortune.setFragmentText(3, 2, 1, "then peace returns.");
        fortune.setFragmentText(3, 3, 0, "Hold your ground.");
        fortune.setFragmentText(3, 3, 1, "Breathe before you move.");

        // Card 4: Mystery
        fortune.setFragmentText(4, 1, 0, "The unknown watches in silence");
        fortune.setFragmentText(4, 1, 1, "Every question hides an answer");
        fortune.setFragmentText(4, 2, 0, "while the unknown waits.");
        fortune.setFragmentText(4, 2, 1, "until it is revealed.");
        fortune.setFragmentText(4, 3, 0, "Don't look away.");
        fortune.setFragmentText(4, 3, 1, "Let curiosity guide you.");

        // Card 5: Silence
        fortune.setFragmentText(5, 1, 0, "Silence grows where truth should speak");
        fortune.setFragmentText(5, 1, 1, "In stillness you find what words cannot say");
        fortune.setFragmentText(5, 2, 0, "until it consumes your voice.");
        fortune.setFragmentText(5, 2, 1, "before peace takes form.");
        fortune.setFragmentText(5, 3, 0, "Listen to the void.");
        fortune.setFragmentText(5, 3, 1, "Let quiet guide your thoughts.");

        // Card 6: Flicker
        fortune.setFragmentText(6, 1, 0, "The light trembles on the edge");
        fortune.setFragmentText(6, 1, 1, "A spark appears between thoughts");
        fortune.setFragmentText(6, 2, 0, "before darkness claims it.");
        fortune.setFragmentText(6, 2, 1, "until it steadies again.");
        fortune.setFragmentText(6, 3, 0, "Blink and it's gone.");
        fortune.setFragmentText(6, 3, 1, "Keep it alive.");

        // Card 7: Descent
        fortune.setFragmentText(7, 1, 0, "You sink beneath what once was light");
        fortune.setFragmentText(7, 1, 1, "Let yourself fall without fear");
        fortune.setFragmentText(7, 2, 0, "where no one follows.");
        fortune.setFragmentText(7, 2, 1, "until you reach understanding.");
        fortune.setFragmentText(7, 3, 0, "Do not fight gravity.");
        fortune.setFragmentText(7, 3, 1, "Rise when you are ready.");

        // Card 8: Fracture
        fortune.setFragmentText(8, 1, 0, "Something within begins to split");
        fortune.setFragmentText(8, 1, 1, "The break reveals what's real");
        fortune.setFragmentText(8, 2, 0, "until only sharp edges remain.");
        fortune.setFragmentText(8, 2, 1, "before the pieces fit again.");
        fortune.setFragmentText(8, 3, 0, "Hold the fragments.");
        fortune.setFragmentText(8, 3, 1, "Wholeness will return.");

        // Card 9: Pulse
        fortune.setFragmentText(9, 1, 0, "The rhythm falters under strain");
        fortune.setFragmentText(9, 1, 1, "The beat reminds you you're alive");
        fortune.setFragmentText(9, 2, 0, "before silence wins.");
        fortune.setFragmentText(9, 2, 1, "until calm returns.");
        fortune.setFragmentText(9, 3, 0, "Count every breath.");
        fortune.setFragmentText(9, 3, 1, "Follow your own rhythm.");

        // Card 10: Reflection
        fortune.setFragmentText(10, 1, 0, "The mirror shows what you deny");
        fortune.setFragmentText(10, 1, 1, "What you see is what you can change");
        fortune.setFragmentText(10, 2, 0, "until the face becomes a stranger.");
        fortune.setFragmentText(10, 2, 1, "before truth settles in.");
        fortune.setFragmentText(10, 3, 0, "Don't look too long.");
        fortune.setFragmentText(10, 3, 1, "Accept what looks back.");

        // Card 11: Shadow
        fortune.setFragmentText(11, 1, 0, "The shadow moves before you do");
        fortune.setFragmentText(11, 1, 1, "What hides in dark still follows light");
        fortune.setFragmentText(11, 2, 0, "and it reveals what you refused to see.");
        fortune.setFragmentText(11, 2, 1, "before fading behind you.");
        fortune.setFragmentText(11, 3, 0, "Face it.");
        fortune.setFragmentText(11, 3, 1, "Let it pass.");

        // Card 12: Veil
        fortune.setFragmentText(12, 1, 0, "The veil falls between knowing and seeing");
        fortune.setFragmentText(12, 1, 1, "The veil softens what truth cannot bear");
        fortune.setFragmentText(12, 2, 0, "until only shapes remain.");
        fortune.setFragmentText(12, 2, 1, "before it opens again.");
        fortune.setFragmentText(12, 3, 0, "Look beyond it.");
        fortune.setFragmentText(12, 3, 1, "Lift it gently.");

        // Card 13: Anchor
        fortune.setFragmentText(13, 1, 0, "The anchor drags beneath your calm");
        fortune.setFragmentText(13, 1, 1, "Hold steady where the storm begins");
        fortune.setFragmentText(13, 2, 0, "and it pulls you down.");
        fortune.setFragmentText(13, 2, 1, "until the tide turns.");
        fortune.setFragmentText(13, 3, 0, "Cut the weight.");
        fortune.setFragmentText(13, 3, 1, "Stay grounded.");

        // Card 14: Whisper
        fortune.setFragmentText(14, 1, 0, "The whisper tells what you shouldn't hear");
        fortune.setFragmentText(14, 1, 1, "A gentle voice speaks beneath thought");
        fortune.setFragmentText(14, 2, 0, "until silence hides it again.");
        fortune.setFragmentText(14, 2, 1, "before it fades to calm.");
        fortune.setFragmentText(14, 3, 0, "Don't repeat it.");
        fortune.setFragmentText(14, 3, 1, "Keep it close.");

        vm.stopBroadcast();
        
        console.log("Loaded all 90 fortune text fragments!");
    }
}
