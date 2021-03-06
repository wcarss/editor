window.onload = function () {
  var main = function () {
    var add_canvas = function (node_id, id, width, height) {
        var canvas = document.createElement('canvas'),
          div = document.getElementById(node_id);

        //canvas.style = "position: relative; top: 0; left: 0;";
        canvas.style = "position: absolute;";
        canvas.id = id;
        canvas.width = width;
        canvas.height = height;
        div.appendChild(canvas);

        return canvas;
      },


      create_map = function (xsize, ysize) {
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
      },


      add_layer = function (map) {
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
      },


      load_map = function (map_definition) {
        return JSON.parse(map_definition);
      },


      get_key = function (a, b) {
        return a + ", " + b;
      },


      load_tilemaps = function (image_names) {
        var load_images = function (filenames) {
            var load_image = function (filename) {
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
                img.src = "../images/" + filename;
                return promise;
              },
              image_promises = [];

            for (i in filenames) {
              image_promises.push(load_image(filenames[i]));
            }
            return image_promises;
          },

          canvas_from_image = function (image, width, height) {
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
          },

          image_register = {};

        image_promises = load_images(image_names);
        Promise.all(image_promises).then(
          function (images) {
            console.log("everything loaded!");
            for (i in images) {
              image_reference = images[i];
              image = image_reference['img'];
              filename = image_reference['filename'];
              image_register[filename] = canvas_from_image(image);
            }
          }, function () {
            console.log("trouble!");
            console.log(image_register);
        });

        return {'image_register': image_register, 'image_promises': image_promises};
      },


      resize_map = function(map, x_size, y_size) {
        var base_canvas = document.getElementById("base_canvas");
        var player_canvas = document.getElementById("player_canvas");
        var overlay_canvas = document.getElementById("overlay_canvas");

        console.log("resizing from (" + map.meta.xsize + ", " + map.meta.ysize + ") to (" + x_size + ", " + y_size + ")");
        map.meta.xsize = x_size;
        map.meta.ysize = y_size;
        base_canvas.width = 32 * x_size;
        base_canvas.height = 32 * y_size;
        player_canvas.width = 32 * x_size;
        player_canvas.height = 32 * y_size;
        overlay_canvas.width = 32 * x_size;
        overlay_canvas.height = 32 * y_size;
        base_context = base_canvas.getContext("2d");
        player_context = player_canvas.getContext("2d");
        overlay_context = overlay_canvas.getContext("2d");

        if (!map.player) {
          map.player = {
            'start_x': 2,
            'start_y': 3,
            'x': 2,
            'y': 3,
            'xsize': 28,
            'ysize': 60,
            'speed': 0.7
          }
        }

        draw_map({'base': base_context, 'player': player_context, 'overlay': overlay_context}, map);
      },


      draw_map = function (contexts, map) {
        var block_x_offset = 32, block_y_offset = 32,
          block_x_size = 32, block_y_size = 32,
          xsize = map['meta']['xsize'], ysize = map['meta']['ysize'],
          top_layer = map['meta']['top_layer'],
          layer_index = 0, i = 0, j = 0;

        context = contexts['base'];
        for (layer_index = 0; layer_index <= 2; layer_index++) {
          layer = map['layers'][layer_index];
          if (!layer) {
            continue;
          }
          for (i = 0; i < xsize; i++) {
            for (j = 0; j < ysize; j++) {
              tile = layer[get_key(i, j)];
              if (tile) {
                context.drawImage(
                  image_register[tile['filename']],
                  tile['x_index']*16, tile['y_index']*16,
                  16, 16,
                  i*32, j*32,
                  32, 32
                );
              }
            }
          }
        }

        context = contexts['player'];
        context.clearRect(map.player.x*32-8, (map.player.y-1)*32, 48, 64);
        context.drawImage(
          image_register['Tutorial018.png'],
          0, 63,
          24, 32,
          map.player.x*32-8,
          (map.player.y-1)*32,
          48, 64
        );
        // context.fillStyle = "maroon";
        // context.fillRect(map.player.x*32, (map.player.y-1)*32, map.player.xsize, map.player.ysize);

        context = contexts['overlay'];
        for (layer_index = 3; layer_index <= top_layer; layer_index++) {
          layer = map['layers'][layer_index];
          if (!layer) {
            continue;
          }
          for (i = 0; i < xsize; i++) {
            for (j = 0; j < ysize; j++) {
              tile = layer[get_key(i, j)];
              if (tile) {
                context.drawImage(
                  image_register[tile['filename']],
                  tile['x_index']*16, tile['y_index']*16,
                  16, 16,
                  i*32, j*32,
                  32, 32
                );
              }
            }
          }
        }
      },


      setup_clicks = function (map, context, image_register) {
        var load_button = document.getElementById("map_load"),
          state = document.getElementById("stage");

        load_button.addEventListener("click", function(event) {
          var map_text = document.getElementById("map_text"),

          map = load_map(map_text.value);
          resize_map(map, map.meta.xsize, map.meta.ysize);
        });

        if (!map.player) {
          map.player = {
            'start_x': 2,
            'start_y': 3,
            'x': 2,
            'y': 3,
            'xsize': 28,
            'ysize': 60,
            'speed': 1
          }
        }

        stage.addEventListener("keydown", function(event) {
          if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
          }

          context.clearRect(map.player.x*32-8, (map.player.y-1)*32, 48, 64);
          switch (event.key) {
            case "ArrowLeft":
              map.player.x -= map.player.speed / 4;
              y_offset = 96;
            break;
            case "ArrowRight":
              map.player.x += map.player.speed / 4;
              y_offset = 32;
            break;
            case "ArrowUp":
              map.player.y -= map.player.speed / 4;
              y_offset = 0;
            break;
            case "ArrowDown":
              map.player.y += map.player.speed / 4;
              y_offset = 64;
            break;
          }
          //context.fillStyle = "maroon";
          //context.fillRect(map.player.x*32, (map.player.y-1)*32, map.player.xsize, map.player.ysize);
          context.drawImage(
            image_register['Tutorial018.png'],
            Math.round(Math.floor(Math.random() * 3))*24, y_offset,
            24, 32,
            map.player.x*32-8,
            (map.player.y-1)*32,
            48, 64
          );
          //console.log(map.player.x, map.player.y);

          event.preventDefault();
        });
      },

      image_names = [
        'town.png',
        'main.png',
        'dungeon.png',
        'building.png',
        '0002-alice.jpg',
        '1elxy.png',
        'edited-tileset.png',
        'edited-tileset2.png',
        'sygma_dwtileset2.png',
        'ffl3tiles.gif',
        'xnrz1e.png',
        'town15.png',
        'Tutorial018.png',
      ],
      image_stuff = load_tilemaps(image_names),
      image_register = image_stuff.image_register,
      image_promises = image_stuff.image_promises,
      map_definition = '{"meta":{"xsize":"5","ysize":"6","top_layer":3,"active_layer":3},"layers":{"1":{"0, 0":{"filename":"dungeon.png","x_index":25,"y_index":9},"0, 1":{"filename":"dungeon.png","x_index":19,"y_index":3},"0, 2":{"filename":"dungeon.png","x_index":19,"y_index":3},"0, 3":{"filename":"dungeon.png","x_index":19,"y_index":3},"0, 4":{"filename":"dungeon.png","x_index":19,"y_index":3},"0, 5":{"filename":"dungeon.png","x_index":19,"y_index":3},"1, 0":{"filename":"dungeon.png","x_index":25,"y_index":9},"1, 1":{"filename":"dungeon.png","x_index":19,"y_index":3},"1, 2":{"filename":"dungeon.png","x_index":18,"y_index":4},"1, 3":{"filename":"dungeon.png","x_index":18,"y_index":5},"1, 4":{"filename":"dungeon.png","x_index":18,"y_index":6},"1, 5":{"filename":"dungeon.png","x_index":19,"y_index":3},"2, 0":{"filename":"dungeon.png","x_index":25,"y_index":9},"2, 1":{"filename":"dungeon.png","x_index":19,"y_index":3},"2, 2":{"filename":"dungeon.png","x_index":19,"y_index":4},"2, 3":{"filename":"dungeon.png","x_index":19,"y_index":5},"2, 4":{"filename":"dungeon.png","x_index":19,"y_index":6},"2, 5":{"filename":"dungeon.png","x_index":19,"y_index":3},"3, 0":{"filename":"dungeon.png","x_index":25,"y_index":9},"3, 1":{"filename":"dungeon.png","x_index":19,"y_index":3},"3, 2":{"filename":"dungeon.png","x_index":20,"y_index":4},"3, 3":{"filename":"dungeon.png","x_index":20,"y_index":5},"3, 4":{"filename":"dungeon.png","x_index":20,"y_index":6},"3, 5":{"filename":"dungeon.png","x_index":19,"y_index":3},"4, 0":{"filename":"dungeon.png","x_index":25,"y_index":9},"4, 1":{"filename":"dungeon.png","x_index":19,"y_index":3},"4, 2":{"filename":"dungeon.png","x_index":19,"y_index":3},"4, 3":{"filename":"dungeon.png","x_index":19,"y_index":3},"4, 4":{"filename":"dungeon.png","x_index":19,"y_index":3},"4, 5":{"filename":"dungeon.png","x_index":19,"y_index":3}},"2":{"0, 2":{"filename":"dungeon.png","x_index":23,"y_index":9},"0, 4":{"filename":"dungeon.png","x_index":23,"y_index":9},"1, 1":{"filename":"dungeon.png","x_index":23,"y_index":9},"1, 2":{"filename":"dungeon.png","x_index":21,"y_index":14},"1, 3":{"filename":"dungeon.png","x_index":21,"y_index":15},"1, 4":{"filename":"dungeon.png","x_index":27,"y_index":0},"1, 5":{"filename":"dungeon.png","x_index":23,"y_index":9},"2, 2":{"filename":"dungeon.png","x_index":22,"y_index":14},"2, 3":{"filename":"dungeon.png","x_index":22,"y_index":15},"2, 4":{"filename":"dungeon.png","x_index":28,"y_index":0},"3, 1":{"filename":"dungeon.png","x_index":23,"y_index":9},"3, 2":{"filename":"dungeon.png","x_index":23,"y_index":14},"3, 3":{"filename":"dungeon.png","x_index":23,"y_index":15},"3, 4":{"filename":"dungeon.png","x_index":29,"y_index":0},"3, 5":{"filename":"dungeon.png","x_index":23,"y_index":9},"4, 2":{"filename":"dungeon.png","x_index":23,"y_index":9},"4, 4":{"filename":"dungeon.png","x_index":23,"y_index":9}},"3":{"0, 1":{"filename":"dungeon.png","x_index":23,"y_index":8},"0, 3":{"filename":"dungeon.png","x_index":23,"y_index":8},"1, 0":{"filename":"dungeon.png","x_index":23,"y_index":8},"1, 4":{"filename":"dungeon.png","x_index":23,"y_index":8},"3, 0":{"filename":"dungeon.png","x_index":23,"y_index":8},"3, 4":{"filename":"dungeon.png","x_index":23,"y_index":8},"4, 1":{"filename":"dungeon.png","x_index":23,"y_index":8},"4, 3":{"filename":"dungeon.png","x_index":23,"y_index":8}}}}';

    Promise.all(image_promises).then(function () {
      var map = load_map(map_definition),
        base_canvas = add_canvas("stage", "base_canvas", map.meta.xsize*32, map.meta.ysize*32),
        player_canvas = add_canvas("stage", "player_canvas", map.meta.xsize*32, map.meta.ysize*32),
        overlay_canvas = add_canvas("stage", "overlay_canvas", map.meta.xsize*32, map.meta.ysize*32),
        base_context = base_canvas.getContext("2d"),
        player_context = player_canvas.getContext("2d"),
        overlay_context = overlay_canvas.getContext("2d")
        contexts = {'base': base_context, 'player': player_context, 'overlay': overlay_context};

      setup_clicks(map, contexts['player'], image_register);
      draw_map(contexts, map);
    });
  };

  main();
};

