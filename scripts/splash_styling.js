/*

    Name: Zeyu Chen
    Date: March 9th, 2019
    Purpose: Styles the page

*/

const LAYERS  = 3;    // Number of different polygon layers
const POINTS  = 200;  // Number of random points for the shape
const WIDTH   = 150;  // Width of the polygon
const HEIGHT  = 100;  // Height of the polygon
const FORM_LENGTH = 9; // Number of options in the form

var COLOURS   = ["#2F7AA3", "#48A9A6", "#424B54", "#EDC500", "#EF6F6C"]; // Different colours for the polygons
var NAME      = "You"; // Player name
var OFFSET    = 0;

function shuffle(arr){

    /*
    
        Random shuffles an array of items.

        [Input]

            arr [Array] => A list of items to be shuffled.

        [Output]

            arr [Array] => A shuffled list of items.

    */

    // Shuffling based on Fisher-Yates shuffle

    for (let i = arr.length - 1; i > 0; i--) {

        // Get position
        
        let pos = Math.floor(Math.random() * (i + 1));
        
        // Swap

        let temp = arr[i];
        arr[i] = arr[pos];
        arr[pos] = temp;
    
    }

    return arr;

}

function is_clockwise([ax, ay], [bx, by], [cx, cy]){

    /*
    
        Checks if three points are going clockwise.

        [Input]

            ax [Integer] => The X coordinate of point A.
            ay [Integer] => The Y coordinate of point A.

            bx [Integer] => The X coordinate of point B.
            by [Integer] => The Y coordinate of point B.

            cx [Integer] => The X coordinate of point C.
            cy [Integer] => The Y coordinate of point C.

        [Output]

           A boolean, representing the direction of the 3 points.

    */

    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) <= 0;

}

function get_convex_hull(points){

    /*
    
        Grabs the convex hull of a given set of points.

        [Input]

            points [Array] => Represents a list of points in the cartesian plane.

        [Output]

            An array, representing the convex hull of the the given set of points.

    */

    /*

        Steps for Andrew's Monotone Chain (Graham Scan but better):

            1- Sort points by their X coordinate, this will act like we're looking from left to right
            2- Go through each points
                2a - While the last point we had turns clockwise, remove it
                2b - Add the current point
            3- Repeat for bottom hull

        By the end we have a set of points that denote the convex hull, and will be sorted counter-clockwise
            Perfect for drawing the polygon!

    */

    // Sort by X value

    points.sort(([ax, ay], [bx, by]) => ax == bx ? ay - by : ax - bx);

    let lower = [];
    let upper = [];

    // Build lower hull

    for(let point of points){
        while(lower.length > 1 && is_clockwise(lower[lower.length - 2], lower[lower.length - 1], point)) {
            lower.pop();
        }
        lower.push(point);
    }

    // Build upper hull

    for(let point of points.reverse()){
        while(upper.length > 1 && is_clockwise(upper[upper.length - 2], upper[upper.length - 1], point)) {
            upper.pop();
        }
        upper.push(point);
    }

    return lower.concat(upper);

}


function draw_polygons(){

    /*
    
        Draws polygons for the splash page.

        [Input] None

        [Output] None

    */


    // Clear previous polygons

    while(document.getElementById("polygon") != null)
        document.getElementById("splashBack").removeChild(document.getElementById("polygon"));

    // Generate points

    // Grab the convex hull of all the points (Or else everything looks like a shattered mess)

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    svg.id = "polygon";
    svg.setAttribute("viewBox", "0 0 150 100");

    // Get a new set of colours by shuffling the list and grabbing the top three colours

    COLOURS = shuffle(COLOURS);

    for(let layer_id = 0; layer_id < LAYERS; layer_id++){

        let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

        polygon.setAttribute("fill", COLOURS[layer_id]);

        // Generate points

        let points = [];

        for(let point_id = 0; point_id < POINTS; point_id++) {

            // Trying to generate the most random shapes through different formulas while keeping their shape close to a circle/square hybrid.

            let offset = 1 - layer_id / 30;

            let x = Math.floor(WIDTH * Math.random() * offset + layer_id * 3);
            let y = Math.floor(HEIGHT * Math.random() * offset + layer_id * 3);

            if(x > WIDTH)
                x -= x - WIDTH;

            if(y > HEIGHT)
                y -= y - HEIGHT;

            points.push([x, y]);
        }

        // Draw the polygon after getting the convex hull

        for(let [x, y] of get_convex_hull(points)) {
            let point = svg.createSVGPoint();
            point.x = x;
            point.y = y;
            polygon.points.appendItem(point);
        }

        // Display it

        svg.appendChild(polygon);

    }

    document.getElementById("splashBack").appendChild(svg);

}

function begin(diff){

    /*
    
        Loads the game and removes the splash page after the start button has been clicked

        [Input]

            diff [Integer] => Represents the difficulty set by the user

        [Output] None

    */

    // Update difficulty

    OFFSET = diff;

    // Change the game's username

    let name = document.getElementById("player_name").value;

    if(name.length != 0){
		NAME = name;
        document.getElementById("player_display").innerHTML = name;
	}

    // Remove the splash page
	
    let splash = document.getElementById("splash");
    let opacity = 1;

    let timer = setInterval(function() {
        if (opacity <= 0.001){
            clearInterval(timer);
            splash.style.display = 'none';
        }
        splash.style.opacity = opacity;
        splash.style.filter = `alpha(opacity=${opacity * 100})`;
        opacity -= opacity * 0.1;
    }, 10);

    // Picks a random colour for the Scrabble Board hover

    let button_style = `.CANVAS > tr > td:hover { background-color: ${COLOURS[3]}; color: white; }`;
    let style = document.createElement("style");
    style.appendChild(document.createTextNode(button_style));
    document.getElementsByTagName("head")[0].appendChild(style);

}

// INITIALIZE

function begin_drawing(){

    /*
    
        Initializes and begins to draw the polygons for the splash page

        [Input] None
        [Output] None

    */

    // Loads all the options to the form

    let row_option = document.getElementById("row_position");
    let col_option = document.getElementById("col_position");

    for(let pos = 0; pos < FORM_LENGTH; pos++){

        let row_choice = document.createElement("option");
        let col_choice = document.createElement("option");

        row_choice.appendChild(document.createTextNode(String.fromCharCode(pos + 65)));
        col_choice.appendChild(document.createTextNode(pos + 1));

        row_option.appendChild(row_choice);
        col_option.appendChild(col_choice);

    }


    // Draw the first one right now

    draw_polygons();

    // Make a new set of shapes after 800 ms

    setInterval(draw_polygons, 800);

}