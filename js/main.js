window.onload = function () {
  var canvas = addCanvas("stage", "canvas_layer_1", 780, 680);
  var tilemap_canvas = document.getElementById("map_tilemap_canvas");
  var context = canvas.getContext("2d");
  var image_register = {};
  var active_tilemap = null;
  var source_x = 0, source_y = 0;
  var drawing;
  var map;
  context.fillStyle = "maroon";

  Promise.all(loadImages(['images/town.png', 'images/main.png', 'images/dungeon.png', 'images/building.png'])).then(
  	function (images) {
      console.log("everything loaded!");
      console.log(images);
      for (i in images) {
        image_reference = images[i];
        image = image_reference['img'];
        filename = image_reference['filename'];
        image_register[filename] = canvasFromImage(image);
        addTileMap(filename, image);
      }
  	}, function () {
      console.log("trouble!");
      console.log(image_register);
  });
  console.log("promises registered!");

  map = createMap(38, 34);
  drawMap(context, map);
  fixLayerButtons(map);

  var tilemap = document.getElementById("map_tilemap");
  tilemap.addEventListener("click", function(event) {
    var scroll_state = getScrollState(tilemap.id);
    source_x = parseInt(32 * Math.floor((event.clientX + scroll_state['scrollLeft'] - tilemap.offsetLeft) / 32));
    source_y = parseInt(32 * Math.floor((event.clientY + scroll_state['scrollTop'] - tilemap.offsetTop) / 32));
    console.log("source: " + source_x + ", " + source_y);
  });

  var stage = document.getElementById("stage")
  stage.addEventListener("mousedown", function(event) {
    drawing = true;
    paintOnMap(event);
  });

  document.addEventListener("mouseup", function(event) {
    drawing = false;
  });

  stage.addEventListener("mousemove", function(event) {
    if (drawing) {
      paintOnMap(event);
    }
  });

  function paintOnMap(event) {
      var scroll_state = getScrollState(stage.id);
      var x_index = parseInt(Math.floor((event.clientX + scroll_state['scrollLeft'] - stage.offsetLeft) / 32)),
        y_index = parseInt(Math.floor((event.clientY + scroll_state['scrollTop'] - stage.offsetTop) / 32))

      layer = map['layers'][map['meta']['active_layer']];

      if(!layer[getKey(x_index, y_index)]) {
        layer[getKey(x_index, y_index)] = {};
      }

      layer[getKey(x_index, y_index)] = {
        'filename': active_tilemap,
        'x_index': source_x / 32,
        'y_index': source_y / 32,
      }
      dest_x = 32 * x_index;
      dest_y = 32 * y_index;
      console.log("dest: " + dest_x + ", " + dest_y);

      context.clearRect(dest_x, dest_y, 32, 32);
      for (var layer_index = 1; layer_index <= map['meta']['top_layer']; layer_index++) {
        layer = map['layers'][layer_index];
        tile = map['layers'][layer_index][getKey(x_index, y_index)];
        if (tile) {
          temp_source_x = tile['x_index'];
          temp_source_y = tile['y_index'];
          tilemap_canvas = image_register[tile['filename']];
          context.drawImage(tilemap_canvas, temp_source_x*16, temp_source_y*16, 16, 16, dest_x, dest_y, 32, 32);
        }
      }
  }

  var saveButton = document.getElementById("map_save");
  var loadButton = document.getElementById("map_load");
  var mapLayerAddButton = document.getElementById("map_layer_add");

  saveButton.addEventListener("click", function(event) {
    var mapText = document.getElementById("map_text");
    mapText.value = saveMap(map);
  });

  loadButton.addEventListener("click", function(event) {
    var mapText = document.getElementById("map_text");
    map = loadMap(mapText.value);
    map_layer_list = document.getElementById("map_layer_list");
    map_layer_list.innerHTML = "";

    drawMap(context, map);
    fixLayerButtons(map);
  });

  mapLayerAddButton.addEventListener("click", function(event) {
    addLayer(map);
    fixLayerButtons(map);
  });

  function addLayer(map) {
    var top_layer = map['meta']['top_layer'];
    if (!top_layer) {
      top_layer = 1;
    } else {
      top_layer += 1;
    }
    map['meta']['top_layer'] = top_layer;
    if (typeof map['layers'][top_layer] === "undefined") {
      map['layers'][top_layer] = {};
    }
    map['meta']['active_layer'] = top_layer;;
  }

function fixLayerButtons(map)  {
  var ol = document.getElementById("map_layer_list");
  ol.innerHTML = "";
  for (var i = 1; i <= map['meta']['top_layer']; i++) {
    addLayerButton(i, map);
  }
}

function addLayerButton(num, map) {
  var ol = document.getElementById("map_layer_list");
  var li = document.createElement("li");
  li.className = "map_layer_list_item";
  if (num === map['meta']['active_layer']) {
    li.className = "map_layer_list_item active_layer";
  }
  li.innerHTML = num;
  li.addEventListener("click", function(event) {
    map['meta']['active_layer'] = num;
    layer_buttons = document.getElementsByClassName("map_layer_list_item");
    for (var i = 0; i < layer_buttons.length; i++) {
      layer_buttons[i].className = "map_layer_list_item";
    }
    event.target.className = "map_layer_list_item active_layer";
  });
  ol.appendChild(li);
}

function getScrollState (id) {
  var node = document.getElementById(id),
    scrollTop = 0,
    scrollLeft = 0;

  while(node.parentNode != null) {
    scrollTop += node.scrollTop;
    scrollLeft += node.scrollLeft;
    node = node.parentNode;
  }

  return {scrollTop: scrollTop, scrollLeft: scrollLeft};
}

function changeActiveTileMap(filename, image) {
  active_tilemap = filename;
  var canvas = document.getElementById("map_tilemap_canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = 960;
  canvas.height = 512;
  ctx.clearRect(0, 0, 960, 512);
  ctx.drawImage(image, 0, 0, 960, 512);
}

function canvasFromImage(image, width, height) {
  var canvas = document.createElement("canvas");
  if (typeof width === "undefined") {
    width = image.width;
  }
  if (typeof height === "undefined") {
   height = image.height;
  }
  canvas.width = width;
  canvas.height = height;
  var context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
  return canvas;
}

function addCanvas(node_id, id, width, height) {
  var canvas = document.createElement('canvas'),
    div = document.getElementById(node_id);

  canvas.style = "position: absolute;";
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  if (div.firstChild) {
    div.insertBefore(canvas, div.firstChild);
    console.log('prepended!');
  } else {
    div.appendChild(canvas);
    console.log('appended!');
  }

  return canvas;
}

function addTileMap(filename, image) {
  var li = document.createElement('li'),
    p = document.createElement('p'),
    ol = document.getElementById("map_list");

  var tilemap_canvas = canvasFromImage(image, 240, 128);
  tilemap_canvas.addEventListener('click', function () {
      changeActiveTileMap(filename, image_register[filename]);
    },
    false
  );

  p.innerHTML = filename;
  li.appendChild(p);
  li.appendChild(tilemap_canvas);
  ol.appendChild(li);

  return tilemap_canvas;
}

function drawMap(context, map) {
  var block_x_offset = 32, block_y_offset = 32,
    block_x_size = 32, block_y_size = 32,
    xsize = map['meta']['xsize'], ysize = map['meta']['ysize'],
    top_layer = map['meta']['top_layer'];

  for (var layer_index = 1; layer_index <= top_layer; layer_index++) {
    layer = map['layers'][layer_index];
    for (i = 0; i < xsize; i++) {
      for (j = 0; j < ysize; j++) {
        context.strokeRect(
          i * block_x_offset, j * block_y_offset,
          block_x_size, block_y_size
        );
        tile = layer[getKey(i, j)];
        if (tile) {
          context.drawImage(image_register[tile['filename']], tile['x_index']*16, tile['y_index']*16, 16, 16, i*32, j*32, 32, 32);
        }
      }
    }
  }
}

function loadImages(filenames) {
  function loadImage(filename) {
	var img = new Image();
	var promise = new Promise(
		function(resolve, reject) {
			img.addEventListener("load", function() {
				console.log("image filename: " + filename + " loaded successfully!");
				resolve({'filename': filename, 'img': img});
			}, false);
			img.addEventListener("error", function() {
				console.log("image filename: " + filename + " failed to load!");
	  			reject();
			}, false);
		}
	);
	img.src = filename;
	return promise
  }

  image_promises = [];
  for (i in filenames) {
    image_promises.push(loadImage(filenames[i]));
  }
  return image_promises;
}

function createMap(xsize, ysize) {
  var map = {
    'meta': {
      'xsize': xsize,
      'ysize': ysize,
    },
    'layers': {
    }
  };
  addLayer(map);
  return map;
}

function saveMap(map) {
    return JSON.stringify(map);
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

// manual testing utility functions

function offscreen_canvas(width, height) {
  var canvas = document.createElement("canvas");
  if (width) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx = canvas.getContext("2d");
  return {c: canvas, ctx: ctx};  
}
function attach_canvas(canvas, name) {
  var ol = document.getElementById("map_list");
  var li = document.createElement("li");
  var p = document.createElement("p");
  p.innerHTML = name;
  li.appendChild(p);
  li.appendChild(canvas);
  ol.appendChild(li);
}
