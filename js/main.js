window.onload = function () {
  var main = function () {
    var add_canvas = function (node_id, id, width, height) {
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
        map['meta']['active_layer'] = top_layer;
      },


      save_map = function (map, creek) {
        var saveable_map = create_map(), i = 0, j = 0, new_tile = null;
        saveable_map.meta.top_layer = map.meta.top_layer;
        saveable_map.meta.active_layer = map.meta.active_layer;
        saveable_map.meta.xsize = map.meta.xsize;
        saveable_map.meta.ysize = map.meta.ysize;

        if (creek) {
          saveable_map = {
            'width': map.meta.xsize * 32,
            'height': map.meta.ysize * 32,
            'id': "map-"+performance.now(),
            'player_layer': map.meta.top_layer,
            'layers': [
            ]
          };
        }

        for (layer_index = 1; layer_index <= map.meta.top_layer; layer_index++) {
          if (creek) {
            saveable_map.layers.push([])
          } else {
            saveable_map.layers[layer_index] = {};
          }

          for (i = 0; i < map.meta.xsize; i++) {
            for (j = 0; j < map.meta.ysize; j++) {
              console.log(layer_index + ": (" + i + ", " + j + ")");
              tile = map.layers[layer_index][get_key(i, j)];
              if (tile) {
                console.log("writing.");
                if (creek) {
                  new_tile = {
                    source_x: tile.x_index*16,
                    source_y: tile.y_index*16,
                    source_width: 16,
                    source_height: 16,
                    x: i*32,
                    y: j*32,
                    x_scale: 2,
                    y_scale: 2,
                    x_size: 32,
                    y_size: 32,
                    id: "tile-"+i+"-"+j,
                    img: tile.filename.slice(0, tile.filename.length-".png".length),
                    layer: layer_index,
                  }
                  saveable_map.layers[layer_index-1].push(new_tile);
                } else {
                  saveable_map.layers[layer_index][get_key(i, j)] = map.layers[layer_index][get_key(i, j)];
                }
              }
            }
          }
        }

        return JSON.stringify(saveable_map);
      },


      load_map = function (map_definition) {
        return JSON.parse(map_definition);
      },


      get_key = function (a, b) {
        return a + ", " + b;
      },


      get_scroll_state = function (id) {
        var node = document.getElementById(id),
          scroll_top = 0,
          scroll_left = 0;

        while(node.parentNode != null) {
          scroll_top += node.scrollTop;
          scroll_left += node.scrollLeft;
          node = node.parentNode;
        }

        return {scroll_top: scroll_top, scroll_left: scroll_left};
      },


      paint_on_map = function (event, map, image_register, source_x, source_y, context) {
        var scroll_state = get_scroll_state(event.target.id),
            tilemap_canvas = null,
            tile = null,
            layer_index = null;
            x_index = parseInt(
              Math.floor((event.clientX + scroll_state['scroll_left'] - stage.offsetLeft) / 32)
            ),
            y_index = parseInt(
              Math.floor((event.clientY + scroll_state['scroll_top'] - stage.offsetTop) / 32)
            ),
            dest_x = 32 * x_index;
            dest_y = 32 * y_index;
            layer = map['layers'][map['meta']['active_layer']];

          layer[get_key(x_index, y_index)] = {
            'filename': image_register['active_tilemap'],
            'x_index': source_x / 32,
            'y_index': source_y / 32,
          };

          context.clearRect(dest_x, dest_y, 32, 32);
          for (layer_index = 1; layer_index <= map['meta']['top_layer']; layer_index++) {
            layer = map['layers'][layer_index];
            tile = map['layers'][layer_index][get_key(x_index, y_index)];
            if (tile) {
              tilemap_canvas = image_register[tile['filename']];
              context.drawImage(
                tilemap_canvas, tile.x_index*16, tile.y_index*16, 16, 16, dest_x, dest_y, 32, 32
              );
            }
          }
      },


      fix_layer_buttons = function (map) {
        var add_layer_button = function (num, map) {
            var ol = document.getElementById("map_layer_list"),
              li = document.createElement("li");

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
          },
          ol = document.getElementById("map_layer_list");

        ol.innerHTML = "";
        for (var i = 1; i <= map['meta']['top_layer']; i++) {
          add_layer_button(i, map);
        }
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
                img.src = "images/" + filename;
                return promise;
              },
              image_promises = [];

            for (i in filenames) {
              image_promises.push(load_image(filenames[i]));
            }
            return image_promises;
          },

          change_active_tilemap = function (image_register, filename) {
            image_register['active_tilemap'] = filename;
            var canvas = document.getElementById("map_tilemap_canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = 960;
            canvas.height = 512;
            ctx.clearRect(0, 0, 960, 512);
            ctx.drawImage(image_register[filename], 0, 0, 960, 512);
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

          add_tile_map = function (image_register, filename) {
            var li = document.createElement('li'),
              p = document.createElement('p'),
              ol = document.getElementById("map_list");

            var tilemap_canvas = canvas_from_image(image_register[filename], 240, 128);
            tilemap_canvas.addEventListener('click', function () {
              change_active_tilemap(image_register, filename);
            }, false);

            p.innerHTML = filename;
            li.appendChild(p);
            li.appendChild(tilemap_canvas);
            ol.appendChild(li);

            return tilemap_canvas;
          },
          image_register = {};

        Promise.all(load_images(image_names)).then(
          function (images) {
            console.log("everything loaded!");
            for (i in images) {
              image_reference = images[i];
              image = image_reference['img'];
              filename = image_reference['filename'];
              image_register[filename] = canvas_from_image(image);
              add_tile_map(image_register, filename);
            }
          }, function () {
            console.log("trouble!");
            console.log(image_register);
        });

        return image_register;
      },


      draw_map = function (context, map) {
        var block_x_offset = 32, block_y_offset = 32,
          block_x_size = 32, block_y_size = 32,
          xsize = map['meta']['xsize'], ysize = map['meta']['ysize'],
          top_layer = map['meta']['top_layer'];

        for (var layer_index = 1; layer_index <= top_layer; layer_index++) {
          layer = map['layers'][layer_index];
          for (i = 0; i < xsize; i++) {
            for (j = 0; j < ysize; j++) {
              context.strokeRect(
                i * block_x_offset, j * block_y_offset, block_x_size, block_y_size
              );
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


      resize_map = function(map, x_size, y_size) {
        var canvas = document.getElementById("main_canvas");

        console.log("resizing from (" + map.meta.xsize + ", " + map.meta.ysize + ") to (" + x_size + ", " + y_size + ")");
        map.meta.xsize = x_size;
        map.meta.ysize = y_size;
        canvas.width = 32 * x_size;
        canvas.height = 32 * y_size;
        context = canvas.getContext("2d");
        draw_map(context, map);
      },


      setup_clicks = function (map, image_register, context) {
        var save_button = document.getElementById("map_save"),
          creek_export_button = document.getElementById("creek_save"),
          load_button = document.getElementById("map_load"),
          map_layer_add_button = document.getElementById("map_layer_add"),
          stage = document.getElementById("stage"),
          map_tilemap = document.getElementById("map_tilemap"),
          x_size_field = document.getElementById("map_x_size"),
          y_size_field = document.getElementById("map_y_size"),
          eraser_button = document.getElementById("eraser_button"),
          flood_button = document.getElementById("flood_button"),
          rect_button = document.getElementById("rect_button"),
          pencil_button = document.getElementById("pencil_button"),
          showpass_button = document.getElementById("show_passability_button"),
          hidepass_button = document.getElementById("hide_passability_button"),
          move_listener = function(event) {
            paint_on_map(event, map, image_register, source_x, source_y, context);
          },
          map_resize_action = debounce(function(event) {
            resize_map(map, x_size_field.value, y_size_field.value);
          }, 550),
          not_implemented_action = function(event) {
            var old_value = event.target.value;
            console.log(old_value + ' is not implemented yet!');
            event.target.value = "not implemented!";
            setTimeout(function() {
              event.target.value = old_value;
            }, 1500);
          },
          source_x = 0, source_y = 0;

        map_tilemap.addEventListener("click", function(event) {
          var tilemap = event.target,
            scroll_state = get_scroll_state(tilemap.id);

          source_x = parseInt(
            32 * Math.floor((event.clientX + scroll_state['scroll_left'] - tilemap.offsetLeft) / 32)
          );
          source_y = parseInt(
            32 * Math.floor((event.clientY + scroll_state['scroll_top'] - tilemap.offsetTop) / 32)
          );
        });

        stage.addEventListener("mousedown", function(event) {
          paint_on_map(event, map, image_register, source_x, source_y, context);
          stage.addEventListener("mousemove", move_listener, false);
        });
        document.addEventListener("mouseup", function(event) {
          stage.removeEventListener("mousemove", move_listener, false);
        });
        save_button.addEventListener("click", function(event) {
          var map_text = document.getElementById("map_text");
          map_text.value = save_map(map, false/* not for creek */);
        });
        creek_export_button.addEventListener("click", function(event) {
          var map_text = document.getElementById("map_text");
          map_text.value = save_map(map, true/* export for creek */);
        });
        load_button.addEventListener("click", function(event) {
          var map_text = document.getElementById("map_text");
          map = load_map(map_text.value);
          map_layer_list = document.getElementById("map_layer_list");
          map_layer_list.innerHTML = "";

          x_size_field.value = map.meta.xsize;
          y_size_field.value = map.meta.ysize;
          resize_map(map, x_size_field.value, y_size_field.value);
          fix_layer_buttons(map);
        });
        map_layer_add_button.addEventListener("click", function(event) {
          add_layer(map);
          fix_layer_buttons(map);
        });

        x_size_field.value = map.meta.xsize;
        y_size_field.value = map.meta.ysize;
        x_size_field.addEventListener("input", map_resize_action);
        y_size_field.addEventListener("input", map_resize_action);

        showpass_button.addEventListener('click', not_implemented_action);
        hidepass_button.addEventListener('click', not_implemented_action);
        eraser_button.addEventListener('click', not_implemented_action);
        fill_button.addEventListener('click', not_implemented_action);
        rect_button.addEventListener('click', not_implemented_action);
        pencil_button.addEventListener('click', not_implemented_action);

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
      ],
      image_register = load_tilemaps(image_names),
      map = create_map(24, 24),
      canvas = add_canvas("stage", "main_canvas", 768, 768),
      context = canvas.getContext("2d");

    setup_clicks(map, image_register, context);
    draw_map(context, map);
    fix_layer_buttons(map);
  };

  main();
};


/* debounce lifted from underscore.js */
/* Copyright (c) 2009-2017 Jeremy Ashkenas, DocumentCloud and Investigative
Reporters & Editors

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE. */

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};
