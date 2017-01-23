window.onload = function () {
  var canvas = addCanvas("stage", "canvas_layer_1", 780, 680);
  var context = canvas.getContext("2d");
  var image_register = {'small': {}, 'big': {}};
  var active_tilemap = null;
  var source_x = 0, source_y = 0;
  var drawing;
  //context.fillRect(30, 30, 30, 30);
  context.fillStyle = "maroon";

  Promise.all(loadImages(image_register, ['images/town.png', 'images/main.png'])).then(
  	function (images) {
      console.log("everything loaded!");
      console.log(image_register['small']);
      console.log(image_register['big']);
      //for (filename in image_register['big']) {
      //  image = image_register['big'][filename];
      //}
      for (filename in image_register['small']) {
      	image = image_register['small'][filename];
      	addTileMap(filename, image);
      	image.addEventListener(
      		'click', function (filename) {
      	      return function () {
      	        changeActiveTileMap(filename, image_register['big'][filename]);
      	      }
      	    }(filename),
      	    false
      	);
      }
  	}, function () {
      console.log("trouble!");
      console.log(image_register);
  });
  console.log("promises registered!");

  map = createMap(38, 34);
  //map = loadMap();
  drawMap(context, map);
  //saveMap(map)

  tilemap = document.getElementById("map_tilemap");
  tilemap.addEventListener("click", function(event) {
    //source_x = event.clientX - tilemap.offsetLeft;
    //source_y = event.clientY - tilemap.offsetTop;
    source_x = parseInt(16 * Math.floor((event.clientX - tilemap.offsetLeft) / 16));
    source_y = parseInt(16 * Math.floor((event.clientY - tilemap.offsetTop) / 16));
    console.log("source: " + source_x + ", " + source_y);
  });

  stage = document.getElementById("stage")
  stage.addEventListener("mousedown", function(event) {
    drawing = true;
    dest_x = parseInt(32 * Math.floor((event.clientX - stage.offsetLeft) / 32));
    dest_y = parseInt(32 * Math.floor((event.clientY - stage.offsetTop) / 32));
    console.log("dest: " + dest_x + ", " + dest_y);
    context.drawImage(image_register['big'][active_tilemap], source_x, source_y, 16, 16, dest_x, dest_y, 32, 32);
  });

  document.addEventListener("mouseup", function(event) {
    drawing = false;
  });

  stage.addEventListener("mousemove", function(event) {
    if (drawing) {
      dest_x = parseInt(32 * Math.floor((event.clientX - stage.offsetLeft) / 32));
      dest_y = parseInt(32 * Math.floor((event.clientY - stage.offsetTop) / 32));
      console.log("dest: " + dest_x + ", " + dest_y);
      context.drawImage(image_register['big'][active_tilemap], source_x, source_y, 16, 16, dest_x, dest_y, 32, 32);
    }
  });

function changeActiveTileMap(filename, image) {
  active_tilemap = filename;
	div = document.getElementById("map_tilemap");
	div.innerHTML = "";
	div.appendChild(image);
}

function addCanvas(node_id, id, width, height) {
  var canvas = document.createElement('canvas'),
    div = document.getElementById(node_id);

  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  div.appendChild(canvas);

  return canvas;
}

function addTileMap(filename, img) {
  var li = document.createElement('li'),
    p = document.createElement('p')
    ol = document.getElementById("map_list");

    img.width = 240;
    img.height = 128;
    p.innerHTML = filename;
    li.appendChild(p);
    li.appendChild(img);
    ol.appendChild(li);
}

function drawMap(context, map) {
    var block_x_offset = 32, block_y_offset = 32,
        block_x_size = 32, block_y_size = 32,
        xsize = map['xsize'], ysize = map['ysize'];

    for (i = 0; i < xsize; i++) {
        for (j = 0; j < ysize; j++) {
            cell = map[getKey(i, j)];
            if (cell['value'] == "X") {
                context.fillStyle = cell['color'];
                context.strokeStyle = cell['color'];
                context.strokeRect(
                    i*block_x_offset, j * block_y_offset,
                    block_x_size, block_y_size
                );
            }
        }
    }
}

function loadImages(image_register, filenames) {
	image_promises = [];
	for (i in filenames) {
		big_image = loadImage(filenames[i]);
		image_promises.push(big_image);
		image_register['big'][filenames[i]] = big_image;
		small_image = loadImage(filenames[i]);
		image_promises.push(small_image);
		image_register['small'][filenames[i]] = small_image;
	}
	return image_promises;
}

function loadImage(filename) {
	var img = new Image();
	var promise = new Promise(
		function(resolve, reject) {
			img.addEventListener("load", function() {
				console.log("image filename: " + filename + " loaded successfully!");
				resolve(img);
			}, false);
			img.addEventListener("error", function() {
				console.log("image filename: " + filename + " failed to load!");
	  			resolve(img);
			}, false);
		}
	);
	img.src = filename;
	return img;
}

function createMap(xsize, ysize) {
    var map = {}
    map['xsize'] = xsize;
    map['ysize'] = ysize;

    for (i = 0; i < xsize; i++) {
        for (j = 0; j < ysize; j++) {
            map[getKey(i, j)] = {
                value: "X",
                color: getNextColor()
            }
        }
    }

    return map;
}

function saveMap(map) {
    return console.log(JSON.stringify(map));
}

function loadMap(map_definition) {
    return JSON.parse(map_definition);
}

function getNextColor() {
    r = parseInt(Math.round(Math.random() * 92)) + 84;
    g = parseInt(Math.round(Math.random() * 64)) + 30; 
    b = parseInt(Math.round(Math.random() * 32)) + 32;
//  r = Math.round(Math.random() * 128 + 64);
//  g = Math.round(Math.random() * 192 + 64);
//  b = Math.round(Math.random() * 64 + 110);
    return "rgba(" + r + ", " + g + ", " + b + ", 0.8)";
}

function getKey(a, b) {
    return a + ", " + b;
}

}