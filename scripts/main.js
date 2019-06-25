/*

	Name: Zeyu Chen
	Date: March 9th, 2019
	Purpose: A Scrabble Game

*/

const PLAYERS   = 2;                                  // Number of players
const LETTERS   = "abcdefghijklmnopqrstuvwxyz";       // Alphabet
const SIZE	    = 9;                                  // Board size
const W_SIZE    = 9;                                  // Max word length
const A_SIZE    = 26;                                 // Number of letters in the alphabet
const N_TILES   = 7;                                  // Number of tiles you have
const MIDDLE    = SIZE >> 1;                          // Center of the board
const DIRCTNS   = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Directions for word placements
const R_DIRCTNS = [[1, 0], [0, 1]];                   // Reverse directions
const ZERO_TURN = 6;                                  // Number of consecutive empty turns

var CHAR_MAP  = new Array(W_SIZE); // Character Map
var BOARD	  = [];                // Grid for the tiles
var BAG	      = [4, 2, 2, 3, 5, 2, 3, 2, 5, 1, 1, 3, 2, 3, 5, 2, 1, 4, 2, 4, 2, 2, 1, 1, 1, 1]; // Amount of tiles for every letter
var CHAR_VAL  = [1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10]; // Tile values
var P_RACK	  = {};                // Player's tile rack
var C_RACK	  = {};                // Computer's tile rack
var VAL_SPOTS = [];                // Mark valid character spots (0 = potential, -1 = not nearby, 1 = taken)
var DIRECTION = 1;                 // Current Orientation

var P_SCORE   = 0; // Player score
var C_SCORE   = 0; // CPU score
var P_LENGTH  = 0; // Number of player's used tiles
var C_LENGTH  = 0; // Number of computer's used tiles
var ROUNDS    = 0; // Number of rounds

var EMPTY_TURNS = 0; // Number of consecutive zero-scoring turns;


function bank_build(){


	/*
	
		Builds the mapping of every word from the word bank

		[Input] None
		[Output] None

	*/

	/*

		The ideal data structure for this should:

			1 - Can find all words that contain a specific letter at a specific position
			2 - Can quickly exclude words depending on different features
			3 - Can quickly check if a word is in a list of words

		Proposal:

			- An array with 9 items (Max word length)
				- Links to 26 maps, one for each character
				- Each map/object contains a set

	*/

	for(let pos = 0; pos < W_SIZE; pos++){

		// Every position in CHAR_MAP is linked to the position of the character in a word
		// Ex: The word "apple" would be found in CHAR_MAP[2]["p"], since "apple"[2] is "p" 
		
		CHAR_MAP[pos] = {};

		for(let char of LETTERS)
			CHAR_MAP[pos][char] = new Set(); // Sets allow for quickly checking if a word is a member of it, O(log n) time

	}

	// Placing every word

	for(let word of WORDS){

		for(let pos = 0; pos < word.length; ++pos)
			CHAR_MAP[pos][word.charAt(pos)].add(word);
	
	}

}

function game_build(){

	/*
	
		Builds the initial game board

		[Input] None
		[Output] None

	*/

	// Build board
	// Standard 2D Array

	for(let x = 0; x < SIZE; x++){
	
		let cur = [];
		let val = [];
	
		for(let y = 0; y < SIZE; y++){
			cur.push("  "); // Empty square
			val.push(-1);   // Marking the square as unplaceable (Will be marked as placeable later)
		}

		// Appending to the current 2D arrays
		BOARD.push(cur);
		VAL_SPOTS.push(val);
	
	}

	// Marking the triple word score tiles

	for(let x = 0; x < SIZE; x += SIZE >> 1)
		for(let y = 0; y < SIZE; y += SIZE >> 1)
			BOARD[x][y] = "3W";

	// Setting the center tile

	BOARD[MIDDLE][MIDDLE] = "**";
	VAL_SPOTS[MIDDLE][MIDDLE] = 0; // Rule of the game: The first move must start at the middle of the board

	// Marking the triple letter score tiles

	for(let x = 1; x < SIZE; x += 2)
		for(let y = 1; y < SIZE; y += 2)
			BOARD[x][y] = "3L";

	// Marking the double word score tiles

	for(let level = 1; level < MIDDLE; ++level){

		BOARD[MIDDLE - level][MIDDLE - level] = "2W";
		BOARD[MIDDLE - level][MIDDLE + level] = "2W";
		BOARD[MIDDLE + level][MIDDLE - level] = "2W";
		BOARD[MIDDLE + level][MIDDLE + level] = "2W";

	}

	// Marking the double letter score tiles

	BOARD[MIDDLE - 1][MIDDLE - 1] = "2L";
	BOARD[MIDDLE - 1][MIDDLE + 1] = "2L";
	BOARD[MIDDLE + 1][MIDDLE - 1] = "2L";
	BOARD[MIDDLE + 1][MIDDLE + 1] = "2L";

	// Give both players the 7 tiles to start the game

	for(let char of LETTERS){
		P_RACK[char] = 0;
		C_RACK[char] = 0;
	}

	for(let cnt = 0; cnt < N_TILES; ++cnt){

		P_RACK[generate_letter()]++;
		C_RACK[generate_letter()]++;

	}

}


function generate_letter(){

	/*
	
		Generates a random letter to simulate drawing a tile out of the bag

		[Input] None
		[Output] 
			letter_picked [String] => Represents the new tile grabbed from the bag

	*/

	let options = [];

	// Find all available tiles in the bag
	// This is better than drawing based on the letters because it takes account of the quantity of every tile left (
	//   - A will be much more likely to be drawn than Z or Q

	for(let char of LETTERS)
		for(let counter = 0; counter < BAG[char.charCodeAt(0) - 97]; counter++)
			options.push(char);

	// Do a random draw

	let letter_picked = options[Math.floor(Math.random() * options.length)];

	// "Take" out the letter, remove it

	BAG[letter_picked]--;

	return letter_picked;
}

function clear_display(){

	/*
	
		Clears the player's rack on the screen, to be replaced by the new and updated rack

		[Input] None
		[Output] None

	*/

	for(let char of LETTERS)
		while(document.getElementById(char) != null) // While there are still tiles on the screen
			document.getElementById("p_rack").removeChild(document.getElementById(char));
	
}

function display_rack(rack, want_shuffle = false){


	/*
	
		Displays the player's rack

		[Input] 

			rack [Object] => Represents the player's current rack of tiles
			want_shuffle [Boolean] => A flag to determine whether the buttons should be displayed in a random order

		[Output] None

	*/

	let rack_letters = [];

	// Generate an array of the rack tiles first

	for(let char of LETTERS)
		for(let repeat = 0; repeat < rack[char]; repeat++)
			rack_letters.push(char);

	if(want_shuffle)
		rack_letters = shuffle(rack_letters);

	// DIsplay and create the buttons

	for(let char of rack_letters){

		// Create button
			
		let button = document.createElement("button");
		let letter = document.createTextNode(char.toUpperCase());
			
		// Add special attributes to the button

		button.appendChild(letter);
		button.addEventListener("click", addLetter);
		button.className = "tile";
		button.id = char;

		// Display it on the screen
				
		document.getElementById("p_rack").appendChild(button);

	}

}

function isInvalidInput(input_string){

	/*
	
		Verifies the user input is a valid set of tiles being used

		[Input]

			input_string [String] => Representing the tiles the user wants to input
		
		[Output] 

			A boolean, representing whether it is a valid input of the text field

	*/

	// The only case of invalid input we're looking for is checking for exceeding tile quantities of one kind
	// Ex: If the user spams the A tile, it should cap it out at the amount of A tiles the user currently has
	
	let INP_RACK = {};
	
	for(let character of input_string){
		
		if(INP_RACK.hasOwnProperty(character)){
			
			INP_RACK[character]++;
		
			if(INP_RACK[character] > P_RACK[character]){

				// Oops, too many tiles of one kind!

				return true;
			}
			
		} else {

			// Initialize the object to count the number of tiles

			INP_RACK[character] = 1;
		}
	}
	
	return false;
}

function addLetter(){

	/*
	
		Adds the tile to the input text box

		[Input] None
		[Output] None

	*/
	
	let added = this.id; // Grab the tile (Will be the ID of the button)
	
	// Check if input is still valid after adding the letter

	if(isInvalidInput(document.getElementById("player_input").value + added)){

		// Prevent from going further if necessary
		
		return;
	}

	// Add the tile to the end
	
	document.getElementById("player_input").value += added;
	
}

function swapTiles(letters, is_computer = false){
	
	/*
	
		Adds the tile to the input text box

		[Input] 

			letters [String] => Represents the tiles the user/computer wishes to swap
			is_computer [Boolean] => A flag to represent which player currently wants to swap tiles

		[Output] None

	*/
	
	for(let char of letters){

		// Get new tile
		
		let new_letter = generate_letter();
		
		if(is_computer){

			// Computer wishes to swap tiles
			
			C_RACK[new_letter]++;
			
		} else {

			// User wishes to swap tiles
		
			P_RACK[new_letter]++;
			
		}
	}
	
	for(let char of letters){
		
		// Put the player's old letters back in the bag
		
		BAG[char.charCodeAt(0)]++;
		
		if(is_computer)
			C_RACK[char]--;
		else
			P_RACK[char]--;
	
	}

}

function grab(X, Y, dx, dy, tiles){
	
	/*
	
		Grabs the longest possible word formed in the grid with given constraints

		[Input] 

			X     [Integer] => Represents the x coordinate of the tiles are first getting dropped at
			Y     [Integer] => Represents the y coordinate of the tiles are first getting dropped at
			dx    [Integer] => Represents the change in the x coordinate of the grid
			dy    [Integer] => Represents the change in the y coordinate of the grid
			tiles [String]m => Represents the tiles getting placed on the board

		[Output]

			new_word [String] => Represents the newly grabbed word while verifying it is possible to grab while using all the tiles

	*/
	
	let new_word = "";
	
	// Go as far back as possible while it there are no empty spaces in between
	
	while(0 <= X - dx && X - dx < SIZE && 0 <= Y - dy && Y - dy < SIZE){

		// Check if there is an empty spot, this will become the starting position of the new word formed with the tiles

		if(BOARD[X - dx][Y - dy].length == 2)
			break;
		
		X -= dx;
		Y -= dy;
	
	}
	
	// Moving forwards while applying the tiles in the given order
	
	for(let pos = 0; pos < tiles.length;){
		
		if(X == SIZE || X < 0 || Y < 0 || Y == SIZE){

			// Too many tiles, somehow we're supposed to place tiles outside of the board!

			return "-1";
		}
		
		if(BOARD[X][Y].length == 1){

			// Already a word there, can't use your tile

			new_word += BOARD[X][Y];

		} else {
			
			// Empty spot, the player is forced to place their tile down here

			new_word += tiles[pos];
			pos++;

		}

		X += dx;
		Y += dy;

	}
	
	// After applying all the tiles, grab the rest of the word that could be possible grabbed
	//  - The only case where this happens is when the tiles are just enough to connect two separate words in the same row/column
	
	while(0 <= X && X < SIZE && 0 <= Y && Y < SIZE){
		
		// Empty tile, we can end here

		if(BOARD[X][Y].length == 2)
			break;
		
		// Keep extending

		new_word += BOARD[X][Y];
		X += dx;
		Y += dy;
	
	}
	
	return new_word;
}	

function get_neighboring_words(X, Y, dx, dy, tiles){

	/*
	
		Returns the score the player gets from neighboring words. Also verifies if the player's move is valid or not.

		[Input] 

			X     [Integer] => Represents the x coordinate of the tiles are first getting dropped at
			Y     [Integer] => Represents the y coordinate of the tiles are first getting dropped at
			dx    [Integer] => Represents the change in the x coordinate of the grid
			dy    [Integer] => Represents the change in the y coordinate of the grid
			tiles [String]  => Represents the tiles getting placed on the board

		[Output]

			score [String] => Represents the score scored from the neighboring words it formed

	*/
	
	// Returns total score of all neighboring words
	// Returns -1 if neighboring words are invalid

	let new_word = grab(X, Y, dx, dy, tiles); // Grab the potentially extended word in the current direction the tiles are getting placed
	
	if(new_word == "-1") // Invalid move!
		return -1;

	if(!CHAR_MAP[0][new_word[0]].has(new_word)) // Checks if this word is a real word
		return -1;
	
	let score = get_word_score(new_word); // Grab score of the word formed
	
		
	for(let pos = 0; pos < tiles.length;){

		// Place a tile down, possibly forming new words with neighboring tiles

		if(BOARD[X][Y].length == 2){


			// Since this potential new word can only be formed in the other orientation, we invert the directions (1 - dx and 1 - dy)
			//    - Only one tile can be placed at this square, so we can at most place one tile down in this orientation, which caps it at tiles[pos]

			new_word = grab(X, Y, 1 - dx, 1 - dy, tiles[pos]); 
			
			// Check for validity of the word
			// Also check if new_word.length > 1 to prevent single letter "words" (that's the tile we placed, so that can't be a "neighboring word")

			if(new_word == "-1" || (new_word.length > 1 && !CHAR_MAP[0][new_word[0]].has(new_word)))
				return -1;

			// If the neighboring word isn't just the tile itself, we can add the score of the word

			if(new_word.length > 1)
				score += get_word_score(new_word);

			pos++;
		
		}

		X += dx;
		Y += dy;
	
	}
	
	return score;
	
}

function is_invalid_placement(x, y, dx, dy, tiles){

	/*
	
		Checks if the placement is valid.

		This placement must:
			1 - Must not get outside of the board after placing the tiles
			2 - Must touch another tile on the board

		[Input] 

			x     [Integer] => Represents the x coordinate of the tiles are first getting dropped at
			y     [Integer] => Represents the y coordinate of the tiles are first getting dropped at
			dx    [Integer] => Represents the change in the x coordinate of the grid
			dy    [Integer] => Represents the change in the y coordinate of the grid
			tiles [String]  => Represents the tiles getting placed on the board

		[Output]

			is_not_touching [Boolean] => Represents the non-validity of the move

	*/
	
	let is_not_touching = true;
	
	for(let pos = 0; pos < tiles.length;){
		
		// Check for out of bounds placement
		
		if(x < 0 || x == SIZE)
			return true;
		if(y < 0 || y == SIZE)
			return true;
		
		if(BOARD[x][y].length != 1){

			 // Only move when we're placing down tiles
			
			pos++;

		}
		
		if(VAL_SPOTS[x][y] == 0) // Find a spot that touches a neighboring word
			is_not_touching = false;
		
		x += dx;
		y += dy;
		
	}
	
	return is_not_touching;
	
}

function get_word_score(word){

	/*
	
		Returns the score of a word scored using scrabble tiles.

		[Input] 

			word [String]  => Represents the word formed through official Scrabble rules

		[Output]

			score [Integer] => Represents the amount of points of the word

	*/

	let score = 0;
	
	for(let letter of word) // Go through every character
		score += CHAR_VAL[letter.charCodeAt(0) - 97];
	
	return score;
	
}

function place_word(x, y, dx, dy, word, is_pretend_placemenet = false){

	/*
	
		Places the given tiles down and returns the score earned, or a score of 0 is the move is invalid.

		[Input] 

			x     [Integer] => Represents the x coordinate of the tiles are first getting dropped at
			y     [Integer] => Represents the y coordinate of the tiles are first getting dropped at
			dx    [Integer] => Represents the change in the x coordinate of the grid
			dy    [Integer] => Represents the change in the y coordinate of the grid
			word  [String]  => Represents the tiles getting placed on the board
			is_pretend_placemenet [Boolean] => A flag to represent whether or not the tiles are pretending to be placed, great for counting the score for the computer player 

		[Output]

			word_score [Integer] => Represents the score earned by placing the tiles

	*/

	// Checks the validity of the move.
	
	if(is_invalid_placement(x, y, dx, dy, word))
		return 0;

	// Get score of neighboring words
	
	let word_score = get_neighboring_words(x, y, dx, dy, word);
	
	// Another validity check

	if(word_score == -1)
		return 0;
	
	// Start placing the tiles, while keeping track of score bonuses

	let word_multiplier = 1; // Multiplier for word score bonuses
	
	for(let pos = 0; pos < word.length;){

		// Apply bonuses as we move
		
		if(BOARD[x][y] == "2W" || BOARD[x][y] == "**"){

			word_multiplier *= 2;

		} else if(BOARD[x][y] == "3W"){

			word_multiplier *= 3;

		} else if(BOARD[x][y] == "2L"){

			word_score += CHAR_VAL[word.charCodeAt(pos) - 97];

		} else if(BOARD[x][y] == "3L"){

			word_score += CHAR_VAL[word.charCodeAt(pos) - 97] * 2;

		}
		
		if(is_pretend_placemenet){

			// DO NOT PLACE THE TILES DOWN, THIS IS JUST SIMULATING THE SCORE FOR THE COMPUTER
			
			if(BOARD[x][y].length != 1)
				pos++;
			
		} else {

			// Place the tiles down, THIS IS A REAL MOVE
			
			if(BOARD[x][y].length != 1){

				BOARD[x][y] = word[pos];

				// Change the display of the specific tile
				
				document.getElementById(`${x}${y}`).innerHTML = word[pos].toUpperCase() + (" " + CHAR_VAL[word.charCodeAt(pos) - 97]).sub().sub();
				document.getElementById(`${x}${y}`).style.backgroundColor = "#5BC0EB";
				document.getElementById(`${x}${y}`).style.color = "white";

				pos++;
			
			}

			// Mark tiles around valid for other tiles that are going to be placed around it
			
			for(let [nx, ny] of DIRCTNS){ // Go through the four cardinal directions

				// Don't place an item out of bounds
				
				if(0 > x + nx || SIZE == x + nx || 0 > y + ny || SIZE == y + ny)
					continue;
				
				// Mark as valid if they aren't occupied

				if(VAL_SPOTS[x + nx][y + ny] == -1)
					VAL_SPOTS[x + nx][y + ny] = 0;
				
			}

			// Current tile is now marked as occupied
			
			VAL_SPOTS[x][y] = 1;
		
		}
		
		x += dx;
		y += dy;
		
	}

	// Multiply score by its multiplier bonus

	word_score *= word_multiplier;

	if(word.length == 7) // 7 tile bonus according to the rules
		word_score += 50;

	return word_score;
	
}

function is_end(){
	
	/*
	
		Checks if the game is over according to the official rules:
			- 6 consecutive scoreless turns
			- No more tiles playable

		[Input] None
		[Output]

			A boolean => A boolean that represents whether or not the game is officially over

	*/
	
	let p_rack_quantity = 0;
	let c_rack_quantity = 0;
	
	for(let letter in LETTERS){

		// Add the current tiles left on the player's rack

		p_rack_quantity += P_RACK[letter];
		c_rack_quantity += C_RACK[letter];
	
	}
	
	// Both are zero, no more moves left

	if(p_rack_quantity == 0 || c_rack_quantity == 0)
		return true;

	// Too many consecutive scoreless turns 
	
	if(EMPTY_TURNS == ZERO_TURN)
		return true;
	
	return false;
	
}

function load_end(){

	/*
	
		Load the end of the game, statistics and other information.

		[Input] None
		[Output] None

	*/

	let splash = document.getElementById("splash");
    let opacity = 0;

    // Swap out which content we're showing

    document.getElementById("splashContent").style.display = "none";
    
    // Make the other splash content visible

    document.getElementById("endContent").style.display = "block";

    // Add statistics to the ending

    let statistics = document.getElementById("endingStatistics");

    let titles   = ["Scores", "Tiles Placed", "Average Points Per Play"];
    let computer_statistics = [C_SCORE, C_LENGTH, Math.floor(C_SCORE / ROUNDS)];
    let player_statistics   = [P_SCORE, P_LENGTH, Math.floor(P_SCORE / ROUNDS)];

    for(let stat = 0; stat < 3; stat++){

    	// Title of the section

    	let header = document.createElement("tr");
    	let header_title = document.createElement("td");
    	let header_title_tag = document.createElement("h3");
    	
    	header_title.setAttribute("colspan", "2");

    	header_title_tag.appendChild(document.createTextNode(titles[stat]));
    	header_title.appendChild(header_title_tag);
    	header.appendChild(header_title);

    	statistics.appendChild(header);

    	// Player statistics

    	header = document.createElement("tr");

    	let player_stat = document.createElement("td");
    	player_stat.appendChild(document.createTextNode(player_statistics[stat]));

    	header.appendChild(player_stat);

    	// Computer statistics

    	let computer_stat = document.createElement("td");
    	computer_stat.appendChild(document.createTextNode(computer_statistics[stat]));

    	header.appendChild(computer_stat);

    	statistics.appendChild(header);

    }

    // Make the splash page visible again

	splash.style.display = 'block';

	let timer = setInterval(function() {

	    if (opacity >= 1)
	        clearInterval(timer);
	    
	    splash.style.opacity = opacity;
	    splash.style.filter = `alpha(opacity=${opacity * 100})`;
	    opacity += (1 - opacity) * 0.01 + 0.1;

	}, 10);

}

function play_turn(move_type = "forfeit"){

	/*
	
		Performs the move requested by the player

		[Input] None
		[Output] None

	*/

	// Get input

	let value	= document.getElementById("player_input").value;
	
	clear_input();

	// Increase counter for empty plays (This will get cleared out anyway if the move is not scoreless)
	
	EMPTY_TURNS++;

	if(move_type == "place"){

		// Placing tiles down
		
		if(value.length < 1){ // Way too short

			alert_user("Illegal move, not enough tiles placed.");

			return;
		}
		// Get coordinates and direction
		
		let row	  = document.getElementById("row_position").selectedIndex;
		let col	  = document.getElementById("col_position").selectedIndex;
		let [dx, dy] = R_DIRCTNS[DIRECTION];
		
		// Get score of the play

		let score = place_word(row, col, dx, dy, value);
		
		if(score == 0){ // Invalid move

			alert_user("Illegal move, make sure all the words formed on the board are real words");
			
			return;

		}
		// Add score, add counter number of tiles used

		P_SCORE += score;
		P_LENGTH += value.length;
		
		// Update score

		document.getElementById("player_score").innerHTML = P_SCORE;
		
		// Remove the rack, it is now outdated

		clear_display();
		
		// Replace with the new rack

		swapTiles(value);
		display_rack(P_RACK);

		// Not scoreless round, reset the counter
		
		EMPTY_TURNS = 0;
		
	} else if(move_type == "grab"){

		let amount = value.length;

		// Check if we have all the tiles required to swap
		
		if(isInvalidInput(value)){

			alert_user("Illegal move, your input does not match your tileset.");

			return;

		}
		
		let cnt = 0;
		
		for(let freq of BAG)
			cnt += freq;
		
		// Another rule of Scrabble: you cannot make any more swaps if there are less than 7 tiles left

		if(cnt < N_TILES){

			alert_user("There are less than 7 tiles in the bag, you cannot draw tiles anymore.");
			return;

		}

		// Update the new rack as requested

		clear_display();
		
		swapTiles(value);
		display_rack(P_RACK);
		
	}

	// Count the number of rounds
	
	ROUNDS++;
	
	// Check if the game ended
	
	if(is_end()){

		load_end();
	
	} else {
	
		// Set a timeout before the computer plays to not demoralize the player ;-;

		setTimeout(computer_play, 300, C_RACK);
	
	}

}

function clear_input(){

	/*
	
		Clears the text field for the player

		[Input] None
		[Output] None

	*/
	
	document.getElementById("player_input").value = "";	

}

function delete_previous(){
	
	/*
	
		Deletes the last character in the text field

		[Input] None
		[Output] None

	*/

	let value = document.getElementById("player_input").value;
	
	document.getElementById("player_input").value = value.substring(0, value.length - 1);
	
}

function switch_direction(){

	/*
	
		Swaps the direction when placing down a word

		[Input] None
		[Output] None

	*/
	
	let value = document.getElementById("direction").innerHTML;

	// Change the direction
	
	if(value == "🡇")
		document.getElementById("direction").innerHTML = "🡆";
	else
		document.getElementById("direction").innerHTML = "🡇";
	
	// Change the direction for the case of playing a move

	DIRECTION ^= 1;

}

function alert_user(warning){

	/*
	
		Warns the user of an invalid move.

		[Input] None

			warning [String] => Represents the error the game should displya for the user.

		[Output] None

	*/


	let status = document.getElementById("status");
	
	status.innerHTML = warning;

    let opacity = 0;

    // Initial fade-in of the text

    let timer = setInterval(function() {

        if (opacity >= 1){

        	// Done fading out
            
            clearInterval(timer);

            // Set a timer for the fadeout

            setTimeout(function(){

            	// Fade out here

            	timer = setInterval(function() {

		        if (opacity < 0.03){
		            clearInterval(timer);
		            status.style.opacity = 0;
		        }

		        status.style.opacity = opacity;
		        status.style.filter = `alpha(opacity=${opacity * 100})`;
		        opacity -= 0.02;

		    }, 40);

            }, 2000);


        }

        status.style.opacity = opacity;
        status.style.filter = `alpha(opacity=${opacity * 100})`;
        opacity += 0.02;

    }, 10);

}