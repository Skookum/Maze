var MazeGen = (function (walkableWidth, walkableHeight) {
    var WALL = "W";
    var FLOOR = "F";

    var height = walkableHeight * 2 - 1;
    var width = walkableWidth * 2 - 1;
    
    // Generate a grid of walls
    function initData() {
	var data = [];
	
	for(var x = 0; x < width; x++) {
	    data.push([]);

	    for(var y = 0; y < height; y++){
		data[x].push(WALL);
	    }
	}

	return data;
    }

    // True if out of bounds
    function outOfBoundsCheck(loc) {
	return loc.x < 0 || loc.x >= width || loc.y < 0 || loc.y >= height;
    }

    function isWallBreakable(data, wallLoc) {
	var offsets = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
	var floorCount = 0;
	
	offsets.forEach(function(offset) {
	    var testFloor = {x: wallLoc.x + offset.x, y: wallLoc.y + offset.y};

	    if(!outOfBoundsCheck(testFloor) && data[testFloor.x][testFloor.y] == FLOOR) {
		floorCount++;
	    }
	});

	return floorCount === 1;
    }

    // return a list of walls that could be made into passages
    function getBreakableWalls(data, loc) {
	var offsets = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
	var results = [];
	
	offsets.forEach(function(offset) {
	    var testWall = {x: loc.x + offset.x, y: loc.y + offset.y};
	    var testFloor = {x: loc.x + offset.x*2, y: loc.y + offset.y*2};
	    
	    // If the floor the wall would lead to is out of bounds then this wall can not be broken
	    // Only return walls that do not lead to a floor
	    if(!outOfBoundsCheck(testWall) && !outOfBoundsCheck(testFloor) && data[testFloor.x][testFloor.y] === WALL && data[testWall.x][testWall.y] === WALL) {						
		results.push(testWall);
	    }
	});

	return results;
    }

    // Find a floor tile touching a wall tile (there should only be one)
    function findFloorForWall(data, loc) {
	var offsets = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];

	for(var i = 0; i < offsets.length; i++){
	    var testLoc = {x: loc.x + offsets[i].x, y: loc.y + offsets[i].y};

	    if(!outOfBoundsCheck(testLoc) && data[testLoc.x][testLoc.y] == FLOOR) {
		return testLoc;
	    }
	}

	console.log("Generator ERROR: Could not find a floor space near a wall!");
	return {x: 0, y: 0};
    }

    function primGenerator(start) {
	var mazeData = initData();
	mazeData[start.x][start.y] = FLOOR;

	var wallStack = getBreakableWalls(mazeData, start);

	// Generation loop
	while(wallStack.length > 0) {
	    // Pick a random wall to break
	    var wallIndex = Math.floor(wallStack.length * Math.random());
	    var wallLoc = wallStack[wallIndex];
	    var existingFloorLoc = findFloorForWall(mazeData, wallLoc);
	    var newFloorLoc = {x: (wallLoc.x - existingFloorLoc.x)*2 +  existingFloorLoc.x, y: (wallLoc.y - existingFloorLoc.y)*2 +  existingFloorLoc.y}; 

	    // Remove this wall
	    wallStack.splice(wallIndex, 1);

	    if(!isWallBreakable(mazeData, wallLoc)) {
		continue;
	    }
	    
	    // Break down the wall
	    mazeData[wallLoc.x][wallLoc.y] = FLOOR;
	    mazeData[newFloorLoc.x][newFloorLoc.y] = FLOOR;

	    // Add new walls to stack
	    wallStack = wallStack.concat(getBreakableWalls(mazeData, newFloorLoc));
	}

	return mazeData;
    }

    // Add some random wall changes so that we have unreachable areas and loops and fun and stuff
    function addNoise(data, amount) {
	var offsets = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
	
	for(var i = 0; i < amount; i++) {
	    var walkableLoc = {x: Math.floor(Math.random() * walkableWidth), y: Math.floor(Math.random() * walkableHeight)};
	    var dataLoc = {x: walkableLoc.x * 2, y: walkableLoc.y * 2};

	    var dir = offsets[Math.floor(Math.random() * offsets.length)];
	    dataLoc.x += dir.x;
	    dataLoc.y += dir.y;
	    
	    if(!outOfBoundsCheck(dataLoc)) {
		data[dataLoc.x][dataLoc.y] = Math.random() < 0.5 ? WALL : FLOOR;
	    }
	}

	return data;
    }

    function directionCheck(data, loc, direction) {
	var wallLoc = {x: loc.x + direction.x, y: loc.y + direction.y};
	return !outOfBoundsCheck(wallLoc) && data[wallLoc.x][wallLoc.y] == FLOOR;
    }

    function createCellData(data, loc) {
	// The data is stored backwards :(
	var dir = {u: {x:-1, y:0}, d: {x:1, y:0}, l: {x:0, y:-1}, r: {x:0, y:1}};

	return {
	    u: directionCheck(data, loc, dir['u']),
	    d: directionCheck(data, loc, dir['d']),
	    l: directionCheck(data, loc, dir['l']),
	    r: directionCheck(data, loc, dir['r'])
	};
    }
    
    // Convert from wall/floor grid to cell/direction array
    function convertToDirectionArray(data) {
	var mazeArray = [];
	var i = 0;
	
	for(var x = 0; x < walkableWidth; x++) {
	    for(var y = 0; y < walkableHeight; y++) {
		mazeArray.push(createCellData(data, {'x': x * 2, 'y': y * 2}));
	    }
	}

	return mazeArray;
    }

    // The actual generation function
    return function() {
	console.log("Generating maze of size [" + width + ", " + height + "]");
	
	var mazeData = primGenerator({x: 0, y: 0});

	// Add 25% random noise, this will make some maps unsolvable. It will also add loops.
	mazeData = addNoise(mazeData, (Math.random() * 0.25) * walkableWidth * walkableHeight);
	
	/*
	mazeData.forEach(function (row) {
	    var r = "";

	    row.forEach(function (block) {
		r += block === FLOOR ? '_' : 'X';
	    });

	    console.log(r);
	});
	*/

	return convertToDirectionArray(mazeData);
    };
});
