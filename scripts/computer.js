/*

	Name: Zeyu Chen
	Date: March 9th, 2019
	Purpose: A Scrabble computer to play against the player

*/

var PERMUTATIONS = new Array(8); // Stores all permutation numbers

// Example: PERMUTATION[3] = [123, 132, 213, 231, 312, 321];

/*
	
		Sketch of computer strategy:
		
			1 - Get all tile combinations (13699 combinations is the upper bound, 7 is the lower bound)
			2 - Get all positions where placing is valid with current tile combination
			
			At this point, there aren't a lot of combination.
			This makes it possible to compute a few moves ahead
				
				- Since we can't find out what tiles we get from the bag, it's not optimal and wastes resources to compute after your move
			
			We then keep track of the moves that give us the biggest advantage, then do that move :)
			
			Other factors:
				
				- Keep good tiles in hand (A, E, I, L, R, N, S, T)
					- starline!
					- having too many duplicates is bad
			
			Factors for evaluating a good play:
				1 - Points scored
				2 - Consistency of letters left (Compare resemblance to STARLINE)	
				3 - Spots on the board (3WS, 2WS, etc)
					- Get as many bonus tiles!
				
*/

function get_consistency(rack_letters, used){

	/*
	
		Gets a score of how consistent the tiles left can be for getting good scores in the future

		[Input]

			rack_letters [String] => Represents the letters in the computer rack
			used    [String] => Represents the letters being used in this round

		[Output]

			counter [Integer] => Represents the consistency. Higher is better.

	*/

	// Count number of tiles that fit in STARLINE
	// Subtract by number of duplicate tiles

	let counter = 0;
	let unique_letters = new Set(); // Enables fast lookup

	let pos = 0;

	for(let letter of rack_letters){

		// Check if we're using this tile right now

		if(pos < used.length && letter == used[pos]){
			pos++;
			continue;
		}

		// Check if it is a tile in STARLINE

		if("starline".includes(letter))
			counter++;

		// Stop if we have more than one of these tiles already

		if(unique_letters.has(letter))
			counter--;

		// Mark this letter as already appeared

		unique_letters.add(letter);

	}

	return counter;

}

function computer_swap(letters){

	/*
	
		Swaps the tiles for the computer after a play.

		[Input]

			letters [String] => Represents the letters in the computer rack being swapped

		[Output] None

	*/

	let tile_total = 0;

	for(let amount of BAG)
		tile_total += amount;

	// Prevent swapping if there are less than 7 tiles according to the rules

	if(tile_total < 7)
		return;

	// Swap

	swapTiles(letters, true);

}


function computer_play(rack){


	/*
	
		Computes and finds the best move for the computer.

		[Input]

			rack [Object] => Represents the letters in the computer rack

		[Output] None

	*/
	
	
	/*
	
		nPr(7, 1..7) = 13699
		
		81 possible positions, two possible directions
		
		Total possible spots: 13699 * 81 * 2 = 2219238 possibilities in the worst case (which will almost never happen considering 81 possible starting tiles is impossible)
		
		Considering how Javascript can do 5 * 10^8 calculations in a single second, I think there's plenty of time for the computer to think :) 
	
	*/
	
	function* combination(letters, rack, pos, current){
		
		/*
	
			Generates all possible subsequences of a given tileset.
      
      Recursively goes through every unique letter, tries to go through all # of tiles with it.
        Could also just recursively pick/don't pick a tile, but we'll get way too many duplicates.

			[Input]

				letters [String]  => Represents the *unique* letters that are usable 
				rack    [Object]  => Holds the quantity of each letter in the rack
				pos     [Integer] => A pointer to keep track of which letter it is currently at
				current [String]  => Holds the current subsequence

			[Output]
				current [String] => A valid subsequence of the tileset

		*/

		// Base case, we reached the end
		
		if(pos == letters.length)
			yield current;

		// Don't forget repeats, we'll add them as we go until we run out
		
		let add = "";
		
		for(let repeat = 0; repeat <= rack[letters[pos]]; repeat++){

			// Generate the rest
			
			yield* combination(letters, rack, pos + 1, current + add);
			
			// Add the duplicates

			add += letters[pos];
		
		}
		
	}
	
	let letters = "";
	let scores = [];

	// Generate the *unique* tiles we have (NO DUPLICATES)

	for(let letter of LETTERS){
		if(rack[letter] != 0)
			letters += letter;
	}

	for(let combo of combination(letters, rack, 0, "")){
		
		// Generate combinations
		// For every combination, get every permutation
		// Check if this permutation is valid
		// "Use it", get the score, get the consistency
		
		if(combo.length == 0) // Empty combination
			continue;

		// Get tileset consistency
		
		let consistency_score = get_consistency(letters, combo);
		
		for(let permutation_number of PERMUTATIONS[combo.length]){

			// Generate all permutations
			
			let state = "";
			
			while(permutation_number != 0){
				state += combo[permutation_number % 10 - 1];
				permutation_number = Math.floor(permutation_number / 10);
			}

			// Go through every spot on the grid
			
			for(let x = 0; x < SIZE; x++){
				for(let y = 0; y < SIZE; y++){
					
					// Starting spot is now [x, y]

					// Go through both reading directions (Down, Right)
					
					for(let [dx, dy] of [[1, 0], [0, 1]]){
						
						// Check for move validity
						
						if(is_invalid_placement(x, y, dx, dy, state))
							continue;
						
						let neighbor_score = get_neighboring_words(x, y, dx, dy, state);
						
						if(neighbor_score == -1)
							continue;
						
						// Found valid placement, time to get the score

						scores.push([place_word(x, y, dx, dy, state, true), consistency_score, x, y, dx, dy, state]);
						
					}
				}
			}
		}
	}
	
	if(scores.length == 0){

		// We can't do anything, might as well swap everything for a better tileset
		
		computer_swap(letters);

	} else {

		// Sort all possible options

		scores.sort((A, B) => A[0] == B[0] ? A[1] - B[1] : A[0] - B[0]);

		// This is solely for the difficulty range

		// Split options into thirds, easy will get the 1/3 worst moves, hard will get the top 1/3 options

		let range = Math.floor(scores.length / 3);

		// Grab a move

		let best_move = scores[Math.floor(range * (0.5 + Math.abs(0.5 - Math.random())) + range * OFFSET)];
		
		// Place it, add the score

		C_SCORE += place_word(best_move[2], best_move[3], best_move[4], best_move[5], best_move[6]);
		C_LENGTH += best_move[6].length;

		// Display the new score

		document.getElementById("computer_score").innerHTML = C_SCORE;
		
		// Swap the used tiles out

		computer_swap(best_move[6]);

	}

}