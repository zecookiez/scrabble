/*

	Name: Zeyu Chen
	Date: March 9th, 2019
	Purpose: Precomputes and initalizes the main script

*/


function generate_permutation(){
	
	// Step 0 - Precompute all possible permutations of lengths from 1 - 7
	
	PERMUTATIONS[1] = [1]; // Base case
	
	for(let length = 2; length <= W_SIZE; length++){
		
		PERMUTATIONS[length] = [];
		
		for(let prev_perm of PERMUTATIONS[length - 1]){
			
			// Using previous permutations, insert current number into every position
			
			let power = 1;
			let first_half = prev_perm; // Left side of the numbers
			let second_half = 0; // Right side of the numbers

			// The new number will be inserted between left and right side
			
			PERMUTATIONS[length].push(first_half * 10 + length);
			
			while(first_half != 0){
				
				second_half += first_half % 10 * power;
				first_half = Math.floor(first_half / 10);
				power *= 10;
				
				PERMUTATIONS[length].push((first_half * 10 + length) * power + second_half);
				
			}
		}
	}	
	
}

function initialize(){
	
	// Initialize everything
	
	console.time("Build Time");

	
	game_build();
	display_rack(P_RACK);
	clear_input();
	generate_permutation();
	
	bank_build();
	draw_board();

	console.timeEnd("Build Time");

}