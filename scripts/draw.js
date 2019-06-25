/*

	Name: Zeyu Chen
	Date: March 9th, 2019
	Purpose: Draws and loads the HTML game elements

*/

const TABLE_SIZE = 9;

function change_form(){

	/*
	
		Updates the input form based on the clicking in the board

		[Input] None
		[Output] None

	*/

	// The convenient trick here is to set the id of the cell you want as the coordinate
	
	let row = Number(this.id[0]);
	let col = Number(this.id[1]);
	
	document.getElementById("row_position").selectedIndex = row;
	document.getElementById("col_position").selectedIndex = col;

}

function draw_board(){

	/*
	
		Creates the HTML game board

		[Input] None
		[Output] None

	*/

	// Draw HTML Table
	
	let game_body = document.getElementById("content");
	
	let content = document.createElement("table");
	
	let table_row, table_cell;

	// Create the outer boarder to mark as guides
	
	table_row = document.createElement("tr");
	
	for(let col = 0; col <= TABLE_SIZE; col++){
		
		table_cell = document.createElement("td");

		// Style separately from the rest of the table
		
		if(col > 0)
			table_cell.appendChild(document.createTextNode(col));
		else
			table_cell.style.borderBottom = 0;
		
		table_cell.id = "border";
		table_cell.style.borderLeft = 0;
		table_cell.style.borderRight = 0;
		table_row.appendChild(table_cell);
		
	}
	
	content.appendChild(table_row);
	
	for(let row = 0; row < TABLE_SIZE; row++){
		
		table_row = document.createElement("tr");
		
		// More border cells, style accordingly
		
		table_cell = document.createElement("td");
		table_cell.appendChild(document.createTextNode(LETTERS[row].toUpperCase()));
		table_cell.id = "border";
		table_cell.style.borderTop = 0;
		table_cell.style.borderBottom = 0;
		table_row.appendChild(table_cell);

		// Draw the rest of the cells of the game
		
		for(let col = 0; col < TABLE_SIZE; col++){
			
			table_cell = document.createElement("td");
			
			table_cell.appendChild(document.createTextNode(BOARD[row][col]));
			
			// Set the ID, create eventListener for allowing different methods of input

			table_cell.id = `${row}${col}`;
			
			table_cell.addEventListener("click", change_form);
			
			table_row.appendChild(table_cell);
			
		}
		
		content.appendChild(table_row);
	
	}
	
	content.className = "CANVAS";
	content.id    = "CANVAS";
	content.border = "1";
	
	game_body.appendChild(content);
	
}