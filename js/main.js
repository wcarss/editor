window.onload = function () {
  var canvas = add_canvas("stage", "canvas_layer_1", 780, 680);
  var tilemap_canvas = document.getElementById("map_tilemap_canvas");
  var context = canvas.getContext("2d");
  var image_register = {};
  var active_tilemap = null;
  var source_x = 0, source_y = 0;
  var drawing;
  var map;
  var image_names = ['images/town.png', 'images/main.png', 'images/dungeon.png', 'images/building.png'];

  Promise.all(load_images(image_names)).then(
  	function (images) {
      console.log("everything loaded!");
      console.log(images);
      for (i in images) {
        image_reference = images[i];
        image = image_reference['img'];
        filename = image_reference['filename'];
        image_register[filename] = canvas_from_image(image);
        add_tile_map(filename, image);
      }
  	}, function () {
      console.log("trouble!");
      console.log(image_register);
  });

  map = create_map(38, 34);
  draw_map(context, map);
  fix_layer_buttons(map);

  var tilemap = document.getElementById("map_tilemap");
  tilemap.addEventListener("click", function(event) {
    var scroll_state = get_scroll_state(tilemap.id);
    source_x = parseInt(32 * Math.floor((event.clientX + scroll_state['scroll_left'] - tilemap.offsetLeft) / 32));
    source_y = parseInt(32 * Math.floor((event.clientY + scroll_state['scroll_top'] - tilemap.offsetTop) / 32));
    console.log("source: " + source_x + ", " + source_y);
  });

  var stage = document.getElementById("stage");
  stage.addEventListener("mousedown", function(event) {
    drawing = true;
    paint_on_map(event);
  });

  document.addEventListener("mouseup", function(event) {
    drawing = false;
  });

  stage.addEventListener("mousemove", function(event) {
    if (drawing) {
      paint_on_map(event);
    }
  });

  function paint_on_map(event) {
    var scroll_state = get_scroll_state(stage.id);
    var x_index = parseInt(Math.floor((event.clientX + scroll_state['scroll_left'] - stage.offsetLeft) / 32)),
      y_index = parseInt(Math.floor((event.clientY + scroll_state['scroll_top'] - stage.offsetTop) / 32));

    layer = map['layers'][map['meta']['active_layer']];

    if(!layer[get_key(x_index, y_index)]) {
      layer[get_key(x_index, y_index)] = {};
    }

    layer[get_key(x_index, y_index)] = {
      'filename': active_tilemap,
      'x_index': source_x / 32,
      'y_index': source_y / 32,
    };
    dest_x = 32 * x_index;
    dest_y = 32 * y_index;
    console.log("dest: " + dest_x + ", " + dest_y);

    context.clearRect(dest_x, dest_y, 32, 32);
    for (var layer_index = 1; layer_index <= map['meta']['top_layer']; layer_index++) {
      layer = map['layers'][layer_index];
      tile = map['layers'][layer_index][get_key(x_index, y_index)];
      if (tile) {
        temp_source_x = tile['x_index'];
        temp_source_y = tile['y_index'];
        tilemap_canvas = image_register[tile['filename']];
        context.drawImage(tilemap_canvas, temp_source_x*16, temp_source_y*16, 16, 16, dest_x, dest_y, 32, 32);
      }
    }
  }

  var save_button = document.getElementById("map_save");
  var load_button = document.getElementById("map_load");
  var map_layer_add_button = document.getElementById("map_layer_add");

  save_button.addEventListener("click", function(event) {
    var map_text = document.getElementById("map_text");
    map_text.value = save_map(map);
  });

  load_button.addEventListener("click", function(event) {
    var map_text = document.getElementById("map_text");
    map = load_map(map_text.value);
    map_layer_list = document.getElementById("map_layer_list");
    map_layer_list.innerHTML = "";

    draw_map(context, map);
    fix_layer_buttons(map);
  });

  map_layer_add_button.addEventListener("click", function(event) {
    add_layer(map);
    fix_layer_buttons(map);
  });

  function add_layer(map) {
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

  function fix_layer_buttons(map)  {
    var ol = document.getElementById("map_layer_list");
    ol.innerHTML = "";
    for (var i = 1; i <= map['meta']['top_layer']; i++) {
      add_layer_button(i, map);
    }
  }

  function add_layer_button(num, map) {
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

  function get_scroll_state (id) {
    var node = document.getElementById(id),
      scroll_top = 0,
      scroll_left = 0;

    while(node.parentNode != null) {
      scroll_top += node.scrollTop;
      scroll_left += node.scrollLeft;
      node = node.parentNode;
    }

    return {scroll_top: scroll_top, scroll_left: scroll_left};
  }

  function change_active_tilemap(filename, image) {
    active_tilemap = filename;
    var canvas = document.getElementById("map_tilemap_canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 960;
    canvas.height = 512;
    ctx.clearRect(0, 0, 960, 512);
    ctx.drawImage(image, 0, 0, 960, 512);
  }

  function canvas_from_image(image, width, height) {
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

  function add_canvas(node_id, id, width, height) {
    var canvas = document.createElement('canvas'),
      div = document.getElementById(node_id);

    canvas.style = "position: absolute;";
    canvas.id = id;
    canvas.width = width;
    canvas.height = height;
    if (div.firstChild) {
      div.insertBefore(canvas, div.firstChild);
    } else {
      div.appendChild(canvas);
    }

    return canvas;
  }

  function add_tile_map(filename, image) {
    var li = document.createElement('li'),
      p = document.createElement('p'),
      ol = document.getElementById("map_list");

    var tilemap_canvas = canvas_from_image(image, 240, 128);
    tilemap_canvas.addEventListener('click', function () {
      change_active_tilemap(filename, image_register[filename]);
    }, false);

    p.innerHTML = filename;
    li.appendChild(p);
    li.appendChild(tilemap_canvas);
    ol.appendChild(li);

    return tilemap_canvas;
  }

  function draw_map(context, map) {
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
          tile = layer[get_key(i, j)];
          if (tile) {
            context.drawImage(image_register[tile['filename']], tile['x_index']*16, tile['y_index']*16, 16, 16, i*32, j*32, 32, 32);
          }
        }
      }
    }
  }

  function load_images(filenames) {
    function load_image(filename) {
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
      });
      img.src = filename;
      return promise;
    }
    image_promises = [];
    for (i in filenames) {
      image_promises.push(load_image(filenames[i]));
    }
    return image_promises;
  }

  function create_map(xsize, ysize) {
    var map = {
      'meta': {
        'xsize': xsize,
        'ysize': ysize,
      },
      'layers': {
      }
    };
    add_layer(map);
    return map;
  }

  function save_map(map) {
    return JSON.stringify(map);
  }

  function load_map(map_definition) {
    return JSON.parse(map_definition);
  }

  function get_key(a, b) {
    return a + ", " + b;
  }
}

