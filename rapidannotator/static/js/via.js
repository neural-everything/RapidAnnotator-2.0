function _via_load_submodules() {
    _via_basic_demo_load_img();
}

function _via_basic_demo_load_img(img_url) {
    _via_init();
    _via_show_img_from_buffer(0);
    _via_init_keyboard_handlers();
    _via_init_mouse_handlers();
}

function _via_basic_demo_define_annotations() {
    //var annotations_json = '{"adutta_swan.jpg-1":{"filename":"adutta_swan.jpg","size":-1,"regions":[{"shape_attributes":{"name":"polygon","all_points_x":[116,94,176,343,383,385,369,406,398,364,310,297,304,244,158],"all_points_y":[157,195,264,273,261,234,222,216,155,124,135,170,188,170,175]},"region_attributes":{"name":"Swan","type":"bird","image_quality":{"good_illumination":true}}}],"file_attributes":{"caption":"Swan in lake Geneve","public_domain":"no","image_url":"http://www.robots.ox.ac.uk/~vgg/software/via/images/swan.jpg"}},"wikimedia_death_of_socrates.jpg-1":{"filename":"wikimedia_death_of_socrates.jpg","size":-1,"regions":[{"shape_attributes":{"name":"rect","x":174,"y":139,"width":108,"height":227},"region_attributes":{"name":"Plato","type":"human","image_quality":{"good_illumination":true}}},{"shape_attributes":{"name":"rect","x":347,"y":114,"width":91,"height":209},"region_attributes":{"name":"Socrates","type":"human","image_quality":{"frontal":true,"good_illumination":true}}},{"shape_attributes":{"name":"ellipse","cx":316,"cy":180,"rx":17,"ry":12},"region_attributes":{"name":"Hemlock","type":"cup"}}],"file_attributes":{"caption":"The Death of Socrates by David","public_domain":"yes","image_url":"https://en.wikipedia.org/wiki/The_Death_of_Socrates#/media/File:David_-_The_Death_of_Socrates.jpg"}}}';
    //import_annotations_from_json(annotations_json);
}

"use strict";
const RA_IMAGE_WIDTH = 400; //pixels
const RA_IMAGE_HEIGHT = 480; //pixels

var VIA_REGION_SHAPE = {
    RECT: 'rect',
    CIRCLE: 'circle',
    ELLIPSE: 'ellipse',
    POLYGON: 'polygon',
    POINT: 'point',
    POLYLINE: 'polyline',
    NONE: 'none'
};

var VIA_DISPLAY_AREA_CONTENT_NAME = {
    IMAGE: 'image_panel',
    IMAGE_GRID: 'image_grid_panel',
    SETTINGS: 'settings_panel',
    PAGE_404: 'page_404',
    PAGE_GETTING_STARTED: 'page_getting_started',
    PAGE_ABOUT: 'page_about',
    PAGE_START_INFO: 'page_start_info',
    PAGE_LICENSE: 'page_license'
};

var VIA_ANNOTATION_EDITOR_MODE = {
    SINGLE_REGION: 'single_region',
    ALL_REGIONS: 'all_regions'
};
var VIA_ANNOTATION_EDITOR_PLACEMENT = {
    NEAR_REGION: 'NEAR_REGION',
    IMAGE_BOTTOM: 'IMAGE_BOTTOM',
    DISABLE: 'DISABLE'
};

var VIA_REGION_EDGE_TOL = 5; // pixel
var VIA_REGION_CONTROL_POINT_SIZE = 2;
var VIA_POLYGON_VERTEX_MATCH_TOL = 5;
var VIA_REGION_MIN_DIM = 3;
var VIA_MOUSE_CLICK_TOL = 2;
var VIA_ELLIPSE_EDGE_TOL = 0.2; // euclidean distance
var VIA_THETA_TOL = Math.PI / 18; // 10 degrees
var VIA_POLYGON_RESIZE_VERTEX_OFFSET = 100;
var VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX = 3;
var VIA_CANVAS_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4, 5, 6, 7, 8, 9, 10];
var VIA_REGION_COLOR_LIST = ["#E69F00", "#56B4E9", "#009E73", "#D55E00", "#CC79A7", "#F0E442", "#ffffff"];
// radius of control points in all shapes
var VIA_REGION_SHAPES_POINTS_RADIUS = 3;
// radius of control points in a point
var VIA_REGION_POINT_RADIUS = 3;
var VIA_REGION_POINT_RADIUS_DEFAULT = 3;

var VIA_THEME_REGION_BOUNDARY_WIDTH = 3;
var VIA_THEME_BOUNDARY_LINE_COLOR = "black";
var VIA_THEME_BOUNDARY_FILL_COLOR = "yellow";
var VIA_THEME_SEL_REGION_FILL_COLOR = "#808080";
var VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR = "yellow";
var VIA_THEME_SEL_REGION_OPACITY = 0.5;
var VIA_THEME_MESSAGE_TIMEOUT_MS = 6000;
var VIA_THEME_CONTROL_POINT_COLOR = '#ff0000';

var VIA_CSV_SEP = ',';
var VIA_CSV_QUOTE_CHAR = '"';
var VIA_CSV_KEYVAL_SEP = ':';

var _ra_regions = []; // array holds the created shapes/regions used for REDHEN RAPID ANNOTATOR

var _via_img_src = {}; // image content {abs. path, url, base64 data, etc}
var _via_img_fileref = {}; // reference to local images selected by using browser file selector
var _via_img_count = 0; // count of the loaded images
var _via_canvas_regions = []; // image regions spec. in canvas space
var _via_canvas_scale = 1.0; // current scale of canvas image

var _via_image_id = ''; // id={filename+length} of current image
var _via_image_index = -1; // index

var _via_current_image_filename;
var _via_current_image;
var _via_current_image_width;
var _via_current_image_height;

// a record of image statistics (e.g. width, height)
var _via_img_stat = {};
var _via_is_all_img_stat_read_ongoing = false;
var _via_img_stat_current_img_index = false;

// image canvas
var _via_display_area = document.getElementById('display_area');
var _via_reg_canvas = document.getElementById('region_canvas');
var _via_reg_ctx; // initialized in _via_init()
var _via_canvas_width, _via_canvas_height;

// canvas zoom
var _via_canvas_zoom_level_index = VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX; // 1.0
var _via_canvas_scale_without_zoom = 1.0;

// state of the application
var _via_is_user_drawing_region = false;
var _via_current_image_loaded = true;
var _via_is_window_resized = false;
var _via_is_user_resizing_region = false;
var _via_is_user_moving_region = false;
var _via_is_user_drawing_polygon = false;
var _via_is_region_selected = false;
var _via_is_all_region_selected = false;
var _via_is_loaded_img_list_visible = false;
var _via_is_attributes_panel_visible = false;
var _via_is_reg_attr_panel_visible = false;
var _via_is_file_attr_panel_visible = false;
var _via_is_canvas_zoomed = false;
var _via_is_loading_current_image = false;
var _via_is_region_id_visible = true;
var _via_is_region_boundary_visible = true;
var _via_is_region_info_visible = false;
var _via_is_ctrl_pressed = false;
var _via_is_debug_mode = false;
var _via_is_message_visible = true;

// region
var _via_current_shape = VIA_REGION_SHAPE.NONE;
var _via_current_polygon_region_id = -1;
var _via_user_sel_region_id = -1;
var _via_click_x0 = 0;
var _via_click_y0 = 0;
var _via_click_x1 = 0;
var _via_click_y1 = 0;
var _via_region_click_x, _via_region_click_y;
var _via_region_edge = [-1, -1];
var _via_current_x = 0;
var _via_current_y = 0;

// region copy/paste
var _via_region_selected_flag = []; // region select flag for current image
var _via_copied_image_regions = [];
var _via_paste_to_multiple_images_input;

// message
var _via_message_clear_timer;

// attributes
var _via_attribute_being_updated = 'region'; // {region, file}
var _via_attributes = {
    'region': {},
    'file': {}
};
var _via_current_attribute_id = '';

// region group color
var _via_canvas_regions_group_color = {}; // color of each region

// invoke a method after receiving user input
var _via_user_input_ok_handler = null;
var _via_user_input_cancel_handler = null;
var _via_user_input_data = {};

// annotation editor
var _via_annotaion_editor_panel = document.getElementById('annotation_editor_panel');
var _via_metadata_being_updated = 'region'; // {region, file}
var _via_annotation_editor_mode = VIA_ANNOTATION_EDITOR_MODE.SINGLE_REGION;

// persistence to local storage
var _via_is_local_storage_available = false;
var _via_is_save_ongoing = false;

// all the image_id and image_filename of images added by the user is
// stored in _via_image_id_list and _via_image_filename_list
//
// Image filename list (img_fn_list) contains a filtered list of images
// currently accessible by the user. The img_fn_list is visible in the
// left side toolbar. image_grid, next/prev, etc operations depend on
// the contents of _via_img_fn_list_img_index_list.
var _via_image_id_list = []; // array of all image id (in order they were added by user)
var _via_image_filename_list = []; // array of all image filename
var _via_image_load_error = []; // {true, false}
var _via_image_filepath_resolved = []; // {true, false}
var _via_image_filepath_id_list = []; // path for each file

var _via_reload_img_fn_list_table = true;
var _via_img_fn_list_img_index_list = []; // image index list of images show in img_fn_list
var _via_img_fn_list_html = []; // html representation of image filename list

// image grid
var image_grid_panel = document.getElementById('image_grid_panel');
var _via_display_area_content_name = ''; // describes what is currently shown in display area
var _via_display_area_content_name_prev = '';
var _via_image_grid_requires_update = false;
var _via_image_grid_content_overflow = false;
var _via_image_grid_load_ongoing = false;
var _via_image_grid_page_first_index = 0; // array index in _via_img_fn_list_img_index_list[]
var _via_image_grid_page_last_index = -1;
var _via_image_grid_selected_img_index_list = [];
var _via_image_grid_page_img_index_list = []; // list of all image index in current page of image grid
var _via_image_grid_visible_img_index_list = []; // list of images currently visible in grid
var _via_image_grid_mousedown_img_index = -1;
var _via_image_grid_mouseup_img_index = -1;
var _via_image_grid_img_index_list = []; // list of all image index in the image grid
var _via_image_grid_region_index_list = []; // list of all image index in the image grid
var _via_image_grid_group = {}; // {'value':[image_index_list]}
var _via_image_grid_group_var = []; // {type, name, value}
var _via_image_grid_group_show_all = false;
var _via_image_grid_stack_prev_page = []; // stack of first img index of every page navigated so far

// image buffer
var VIA_IMG_PRELOAD_INDICES = [1, -1, 2, 3, -2, 4]; // for any image, preload previous 2 and next 4 images
var VIA_IMG_PRELOAD_COUNT = 4;
var _via_buffer_preload_img_index = -1;
var _via_buffer_img_index_list = [];
var _via_buffer_img_shown_timestamp = [];
var _via_preload_img_promise_list = [];

// via settings
var _via_settings = {};
_via_settings.ui = {};
_via_settings.ui.annotation_editor_height = 25; // in percent of the height of browser window
_via_settings.ui.annotation_editor_fontsize = 0.8; // in rem
_via_settings.ui.leftsidebar_width = 18; // in rem

_via_settings.ui.image_grid = {};
_via_settings.ui.image_grid.img_height = 80; // in pixel
_via_settings.ui.image_grid.rshape_fill = 'none';
_via_settings.ui.image_grid.rshape_fill_opacity = 0.3;
_via_settings.ui.image_grid.rshape_stroke = 'yellow';
_via_settings.ui.image_grid.rshape_stroke_width = 2;
_via_settings.ui.image_grid.show_region_shape = true;
_via_settings.ui.image_grid.show_image_policy = 'all';

_via_settings.ui.image = {};
_via_settings.ui.image.region_label = '__via_region_id__'; // default: region_id
_via_settings.ui.image.region_color = '__via_default_region_color__'; // default color: yellow
_via_settings.ui.image.region_label_font = '10px Sans';
_via_settings.ui.image.on_image_annotation_editor_placement = VIA_ANNOTATION_EDITOR_PLACEMENT.NEAR_REGION;

_via_settings.core = {};
_via_settings.core.buffer_size = 4 * VIA_IMG_PRELOAD_COUNT + 2;
_via_settings.core.filepath = {};
_via_settings.core.default_filepath = '';

// UI html elements
var invisible_file_input = document.getElementById("invisible_file_input");
var display_area = document.getElementById("display_area");
var ui_top_panel = document.getElementById("ui_top_panel");
var image_panel = document.getElementById("image_panel");
var img_buffer_now = document.getElementById("img_buffer_now");

var annotation_list_snippet = document.getElementById("annotation_list_snippet");
var annotation_textarea = document.getElementById("annotation_textarea");

var img_fn_list_panel = document.getElementById('img_fn_list_panel');
var img_fn_list = document.getElementById('img_fn_list');
var attributes_panel = document.getElementById('attributes_panel');
var leftsidebar = document.getElementById('leftsidebar');

var BBOX_LINE_WIDTH = 4;
var BBOX_SELECTED_OPACITY = 0.3;
var BBOX_BOUNDARY_FILL_COLOR_ANNOTATED = "#f2f2f2";
var BBOX_BOUNDARY_FILL_COLOR_NEW = "#aaeeff";
var BBOX_BOUNDARY_LINE_COLOR = "#1a1a1a";
var BBOX_SELECTED_FILL_COLOR = "#ffffff";

var VIA_ANNOTATION_EDITOR_HEIGHT_CHANGE = 5; // in percent
var VIA_ANNOTATION_EDITOR_FONTSIZE_CHANGE = 0.1; // in rem
var VIA_IMAGE_GRID_IMG_HEIGHT_CHANGE = 20; // in percent
var VIA_LEFTSIDEBAR_WIDTH_CHANGE = 1; // in rem
var VIA_POLYGON_SEGMENT_SUBTENDED_ANGLE = 5; // in degree (used to approximate shapes using polygon)
var VIA_FLOAT_PRECISION = 3; // number of decimal places to include in float values

// COCO Export
var VIA_COCO_EXPORT_RSHAPE = ['rect', 'circle', 'ellipse', 'polygon', 'point'];
//
// Data structure to store metadata about file and regions
//
function file_region() {
    this.shape_attributes = {}; // region shape attributes
    this.region_attributes = {}; // region attributes
}
//
// Initialization routine
//
function _via_init() {
    //document.getElementById('leftsidebar').style.display = 'table-cell';

    // initialize region canvas 2D context
    _via_init_reg_canvas_context();

    // initialize user input handlers (for both window and via_reg_canvas)
    // handles drawing of regions by user over the image
    _via_init_keyboard_handlers();
    _via_init_mouse_handlers();
}

function _via_init_reg_canvas_context() {
    _via_reg_ctx = _via_reg_canvas.getContext('2d');
}

function _via_init_keyboard_handlers() {
    window.addEventListener('keydown', _via_window_keydown_handler, false);
    _via_reg_canvas.addEventListener('keydown', _via_reg_canvas_keydown_handler, false);
    _via_reg_canvas.addEventListener('keyup', _via_reg_canvas_keyup_handler, false);
}

// handles drawing of regions over image by the user
function _via_init_mouse_handlers() {
    _via_reg_canvas.addEventListener('dblclick', _via_reg_canvas_dblclick_handler, false);
    _via_reg_canvas.addEventListener('mousedown', _via_reg_canvas_mousedown_handler, false);
    _via_reg_canvas.addEventListener('mouseup', _via_reg_canvas_mouseup_handler, false);
    _via_reg_canvas.addEventListener('mouseover', _via_reg_canvas_mouseover_handler, false);
    _via_reg_canvas.addEventListener('mousemove', _via_reg_canvas_mousemove_handler, false);
    _via_reg_canvas.addEventListener('wheel', _via_reg_canvas_mouse_wheel_listener, false);
    // touch screen event handlers
    // @todo: adapt for mobile users
    _via_reg_canvas.addEventListener('touchstart', _via_reg_canvas_mousedown_handler, false);
    _via_reg_canvas.addEventListener('touchend', _via_reg_canvas_mouseup_handler, false);
    _via_reg_canvas.addEventListener('touchmove', _via_reg_canvas_mousemove_handler, false);
}


// ensure the exported json string conforms to RFC 4180
// see: https://en.wikipedia.org/wiki/Comma-separated_values
function map_to_json(m) {
    var s = [];
    for (var key in m) {
        var v = m[key];
        var si = JSON.stringify(key);
        si += VIA_CSV_KEYVAL_SEP;
        si += JSON.stringify(v);
        s.push(si);
    }
    return '{' + s.join(VIA_CSV_SEP) + '}';
}

function escape_for_csv(s) {
    return s.replace(/["]/g, '""');
}

function unescape_from_csv(s) {
    return s.replace(/""/g, '"');
}

function remove_prefix_suffix_quotes(s) {
    if (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') {
        return s.substr(1, s.length - 2);
    } else {
        return s;
    }
}

function clone_image_region(r0) {
    var r1 = new file_region();

    // copy shape attributes
    for (var key in r0.shape_attributes) {
        r1.shape_attributes[key] = clone_value(r0.shape_attributes[key]);
    }

    // copy region attributes
    for (var key in r0.region_attributes) {
        r1.region_attributes[key] = clone_value(r0.region_attributes[key]);
    }
    return r1;
}

function clone_value(value) {
    if (typeof (value) === 'object') {
        if (Array.isArray(value)) {
            return value.slice(0);
        } else {
            var copy = {};
            for (var p in value) {
                if (value.hasOwnProperty(p)) {
                    copy[p] = clone_value(value[p]);
                }
            }
            return copy;
        }
    }
    return value;
}

function _via_get_image_id(filename, size) {
    if (typeof (size) === 'undefined') {
        return filename;
    } else {
        return filename + size;
    }
}


//
// Data Exporter
//

function save_data_to_local_file(data, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(data);
    a.download = filename;

    // simulate a mouse click event
    var event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    a.dispatchEvent(event);
}

//
// Maintainers of user interface
//

function init_message_panel() {
    var p = document.getElementById('message_panel');
    p.addEventListener('mousedown', function () {
        this.style.display = 'none';
    }, false);
    p.addEventListener('mouseover', function () {
        clearTimeout(_via_message_clear_timer); // stop any previous timeouts
    }, false);
}

function toggle_message_visibility() {
    if (_via_is_message_visible) {
        show_message('Disabled status messages');
        _via_is_message_visible = false;
    } else {
        _via_is_message_visible = true;
        show_message('Status messages are now visible');
    }
}

function show_message(msg, t) {
    if (_via_message_clear_timer) {
        clearTimeout(_via_message_clear_timer); // stop any previous timeouts
    }
    if (!_via_is_message_visible) {
        return;
    }

    var timeout = t;
    if (typeof t === 'undefined') {
        timeout = VIA_THEME_MESSAGE_TIMEOUT_MS;
    }
    document.getElementById('message_panel_content').innerHTML = msg;
    document.getElementById('message_panel').style.display = 'block';

    _via_message_clear_timer = setTimeout(function () {
        document.getElementById('message_panel').style.display = 'none';
    }, timeout);
}

function _via_regions_group_color_init() {
    _via_canvas_regions_group_color = {};
    var aid = _via_settings.ui.image.region_color;
    if (aid !== '__via_default_region_color__') {
        var avalue;
        for (var i = 0; i < _ra_regions.length; ++i) {
            avalue = _ra_regions[i].region_attributes[aid];
            _via_canvas_regions_group_color[avalue] = 1;
        }
        var color_index = 0;
        for (avalue in _via_canvas_regions_group_color) {
            _via_canvas_regions_group_color[avalue] = VIA_REGION_COLOR_LIST[color_index % VIA_REGION_COLOR_LIST.length];
            color_index = color_index + 1;
        }
    }
}

// transform regions in image space to canvas space
function _via_load_canvas_regions() {
    _via_regions_group_color_init();

    // load all existing annotations into _via_canvas_regions
    var regions = _ra_regions; //_via_current_image_regions;
    _via_canvas_regions = [];
    for (var i = 0; i < regions.length; ++i) {
        var region_i = new file_region();
        for (var key in regions[i].shape_attributes) {
            region_i.shape_attributes[key] = regions[i].shape_attributes[key];
        }
        _via_canvas_regions.push(region_i);

        switch (_via_canvas_regions[i].shape_attributes['name']) {
            case VIA_REGION_SHAPE.RECT:
                var x = regions[i].shape_attributes['x'] / _via_canvas_scale;
                var y = regions[i].shape_attributes['y'] / _via_canvas_scale;
                var width = regions[i].shape_attributes['width'] / _via_canvas_scale;
                var height = regions[i].shape_attributes['height'] / _via_canvas_scale;

                _via_canvas_regions[i].shape_attributes['x'] = Math.round(x);
                _via_canvas_regions[i].shape_attributes['y'] = Math.round(y);
                _via_canvas_regions[i].shape_attributes['width'] = Math.round(width);
                _via_canvas_regions[i].shape_attributes['height'] = Math.round(height);
                break;

            case VIA_REGION_SHAPE.CIRCLE:
                var cx = regions[i].shape_attributes['cx'] / _via_canvas_scale;
                var cy = regions[i].shape_attributes['cy'] / _via_canvas_scale;
                var r = regions[i].shape_attributes['r'] / _via_canvas_scale;
                _via_canvas_regions[i].shape_attributes['cx'] = Math.round(cx);
                _via_canvas_regions[i].shape_attributes['cy'] = Math.round(cy);
                _via_canvas_regions[i].shape_attributes['r'] = Math.round(r);
                break;

            case VIA_REGION_SHAPE.ELLIPSE:
                var cx = regions[i].shape_attributes['cx'] / _via_canvas_scale;
                var cy = regions[i].shape_attributes['cy'] / _via_canvas_scale;
                var rx = regions[i].shape_attributes['rx'] / _via_canvas_scale;
                var ry = regions[i].shape_attributes['ry'] / _via_canvas_scale;
                // rotation in radians
                var theta = regions[i].shape_attributes['theta'];
                _via_canvas_regions[i].shape_attributes['cx'] = Math.round(cx);
                _via_canvas_regions[i].shape_attributes['cy'] = Math.round(cy);
                _via_canvas_regions[i].shape_attributes['rx'] = Math.round(rx);
                _via_canvas_regions[i].shape_attributes['ry'] = Math.round(ry);
                _via_canvas_regions[i].shape_attributes['theta'] = theta;
                break;

            case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
            case VIA_REGION_SHAPE.POLYGON:
                var all_points_x = regions[i].shape_attributes['all_points_x'].slice(0);
                var all_points_y = regions[i].shape_attributes['all_points_y'].slice(0);
                for (var j = 0; j < all_points_x.length; ++j) {
                    all_points_x[j] = Math.round(all_points_x[j] / _via_canvas_scale);
                    all_points_y[j] = Math.round(all_points_y[j] / _via_canvas_scale);
                }
                _via_canvas_regions[i].shape_attributes['all_points_x'] = all_points_x;
                _via_canvas_regions[i].shape_attributes['all_points_y'] = all_points_y;
                break;

            case VIA_REGION_SHAPE.POINT:
                var cx = regions[i].shape_attributes['cx'] / _via_canvas_scale;
                var cy = regions[i].shape_attributes['cy'] / _via_canvas_scale;

                _via_canvas_regions[i].shape_attributes['cx'] = Math.round(cx);
                _via_canvas_regions[i].shape_attributes['cy'] = Math.round(cy);
                break;
        }
    }
}

// updates currently selected region shape
function select_region_shape(sel_shape_name) {
    for (var shape_name in VIA_REGION_SHAPE) {
        var ui_element = document.getElementById('region_shape_' + VIA_REGION_SHAPE[shape_name]);
        ui_element.classList.remove('selected');
    }

    _via_current_shape = sel_shape_name;
    var ui_element = document.getElementById('region_shape_' + _via_current_shape);
    ui_element.classList.add('selected');

    switch (_via_current_shape) {
        case VIA_REGION_SHAPE.RECT: // Fall-through
        case VIA_REGION_SHAPE.CIRCLE: // Fall-through
        case VIA_REGION_SHAPE.ELLIPSE:
            show_message('Press single click and drag mouse to draw ' +
                _via_current_shape + ' region');
            break;

        case VIA_REGION_SHAPE.POLYLINE:
        case VIA_REGION_SHAPE.POLYGON:
            _via_is_user_drawing_polygon = false;
            _via_current_polygon_region_id = -1;

            show_message('[Single Click] to define polygon/polyline vertices, ' +
                '[Backspace] to delete last vertex, [Enter] to finish, [Esc] to cancel drawing.');
            break;

        case VIA_REGION_SHAPE.POINT:
            show_message('Press single click to define points (or landmarks)');
            break;

        default:
            show_message('None shape selected!');
            break;
    }
}

function set_all_canvas_size(w, h) {
    _via_reg_canvas.height = h;
    _via_reg_canvas.width = w;

    image_panel.style.height = h + 'px';
    image_panel.style.width = w + 'px';
}

function set_all_canvas_scale(s) {
    _via_reg_ctx.scale(s, s);
}

function show_all_canvas() {
    image_panel.style.display = 'inline-block';
}

function hide_all_canvas() {
    image_panel.style.display = 'none';
}

function jump_to_image(image_index) {
    if (_via_img_count <= 0) {
        return;
    }

    switch (_via_display_area_content_name) {
        case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID:
            if (image_index >= 0 && image_index < _via_img_count) {
                // @todo: jump to image grid page view with the given first image index
                show_single_image_view();
                _via_show_img(image_index);
            }
            break;
        default:
            if (image_index >= 0 && image_index < _via_img_count) {
                _via_show_img(image_index);
            }
            break;
    }
}

function toggle_all_regions_selection(is_selected) {
    var n = _ra_regions.length;
    var i;
    _via_region_selected_flag = [];
    for (i = 0; i < n; ++i) {
        _via_region_selected_flag[i] = is_selected;
    }
    _via_is_all_region_selected = is_selected;
    //annotation_editor_hide();
    if (_via_annotation_editor_mode === VIA_ANNOTATION_EDITOR_MODE.ALL_REGIONS) {
        annotation_editor_clear_row_highlight();
    }
}

function select_only_region(region_id) {
    toggle_all_regions_selection(false);
    set_region_select_state(region_id, true);
    _via_is_region_selected = true;
    _via_is_all_region_selected = false;
    _via_user_sel_region_id = region_id;
}

function set_region_select_state(region_id, is_selected) {
    _via_region_selected_flag[region_id] = is_selected;
}

//
// Image click handlers
//

// enter annotation mode on double click
function _via_reg_canvas_dblclick_handler(e) {
    e.stopPropagation();
    // @todo: use double click in future
}

// user clicks on the canvas
function _via_reg_canvas_mousedown_handler(e) {
    e.stopPropagation();
    _via_click_x0 = e.offsetX;
    _via_click_y0 = e.offsetY;
    _via_region_edge = is_on_region_corner(_via_click_x0, _via_click_y0);
    var region_id = is_inside_region(_via_click_x0, _via_click_y0);

    if (_via_is_region_selected) {
        // check if user clicked on the region boundary
        if (_via_region_edge[1] > 0) {
            if (!_via_is_user_resizing_region) {
                if (_via_region_edge[0] !== _via_user_sel_region_id) {
                    _via_user_sel_region_id = _via_region_edge[0];
                }
                // resize region
                _via_is_user_resizing_region = true;
            }
        } else {
            var yes = is_inside_this_region(_via_click_x0,
                _via_click_y0,
                _via_user_sel_region_id);
            if (yes) {
                if (!_via_is_user_moving_region) {
                    _via_is_user_moving_region = true;
                    _via_region_click_x = _via_click_x0;
                    _via_region_click_y = _via_click_y0;
                }
            }
            if (region_id === -1) {
                // mousedown on outside any region
                _via_is_user_drawing_region = true;
                // unselect all regions
                _via_is_region_selected = false;
                _via_user_sel_region_id = -1;
                toggle_all_regions_selection(false);
            }
        }
    } else {
        if (region_id === -1) {
            // mousedown outside a region
            if (_via_current_shape !== VIA_REGION_SHAPE.POLYGON &&
                _via_current_shape !== VIA_REGION_SHAPE.POLYLINE &&
                _via_current_shape !== VIA_REGION_SHAPE.POINT) {
                // this is a bounding box drawing event
                _via_is_user_drawing_region = true;
            }
        } else {
            // mousedown inside a region
            // this could lead to (1) region selection or (2) region drawing
            _via_is_user_drawing_region = true;
        }
    }
}

// implements the following functionalities:
//  - new region drawing (including polygon)
//  - moving/resizing/select/unselect existing region
function _via_reg_canvas_mouseup_handler(e) {
    e.stopPropagation();
    _via_click_x1 = e.offsetX;
    _via_click_y1 = e.offsetY;

    var click_dx = Math.abs(_via_click_x1 - _via_click_x0);
    var click_dy = Math.abs(_via_click_y1 - _via_click_y0);

    // indicates that user has finished moving a region
    if (_via_is_user_moving_region) {
        _via_is_user_moving_region = false;
        _via_reg_canvas.style.cursor = "default";

        var move_x = Math.round(_via_click_x1 - _via_region_click_x);
        var move_y = Math.round(_via_click_y1 - _via_region_click_y);

        if (Math.abs(move_x) > VIA_MOUSE_CLICK_TOL ||
            Math.abs(move_y) > VIA_MOUSE_CLICK_TOL) {
            // move all selected regions
            _via_move_selected_regions(move_x, move_y);
        } else {
            // indicates a user click on an already selected region
            // this could indicate the user's intention to select another
            // nested region within this region
            // OR
            // draw a nested region (i.e. region inside a region)

            // traverse the canvas regions in alternating ascending
            // and descending order to solve the issue of nested regions
            var nested_region_id = is_inside_region(_via_click_x0, _via_click_y0, true);
            if (nested_region_id >= 0 &&
                nested_region_id !== _via_user_sel_region_id) {
                _via_user_sel_region_id = nested_region_id;
                _via_is_region_selected = true;
                _via_is_user_moving_region = false;

                // de-select all other regions if the user has not pressed Shift
                if (!e.shiftKey) {
                    toggle_all_regions_selection(false);
                }
                set_region_select_state(nested_region_id, true);
                //annotation_editor_show();
            } else {
                // user clicking inside an already selected region
                // indicates that the user intends to draw a nested region
                toggle_all_regions_selection(false);
                _via_is_region_selected = false;

                switch (_via_current_shape) {
                    case VIA_REGION_SHAPE.POLYLINE: // handled by case for POLYGON
                    case VIA_REGION_SHAPE.POLYGON:
                        // user has clicked on the first point in a new polygon
                        // see also event 'mouseup' for _via_is_user_drawing_polygon=true
                        _via_is_user_drawing_polygon = true;

                        var canvas_polygon_region = new file_region();
                        canvas_polygon_region.shape_attributes['name'] = _via_current_shape;
                        canvas_polygon_region.shape_attributes['all_points_x'] = [Math.round(_via_click_x0)];
                        canvas_polygon_region.shape_attributes['all_points_y'] = [Math.round(_via_click_y0)];
                        var new_length = _via_canvas_regions.push(canvas_polygon_region);
                        _via_current_polygon_region_id = new_length - 1;
                        break;

                    case VIA_REGION_SHAPE.POINT:
                        // user has marked a landmark point
                        var point_region = new file_region();
                        point_region.shape_attributes['name'] = VIA_REGION_SHAPE.POINT;
                        point_region.shape_attributes['cx'] = Math.round(_via_click_x0 * _via_canvas_scale);
                        point_region.shape_attributes['cy'] = Math.round(_via_click_y0 * _via_canvas_scale);
                        _ra_regions.push(point_region);

                        var canvas_point_region = new file_region();
                        canvas_point_region.shape_attributes['name'] = VIA_REGION_SHAPE.POINT;
                        canvas_point_region.shape_attributes['cx'] = Math.round(_via_click_x0);
                        canvas_point_region.shape_attributes['cy'] = Math.round(_via_click_y0);
                        _via_canvas_regions.push(canvas_point_region);
                        break;
                }

            }
        }
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
        return;
    }

    // indicates that user has finished resizing a region
    if (_via_is_user_resizing_region) {
        // _via_click(x0,y0) to _via_click(x1,y1)
        _via_is_user_resizing_region = false;
        _via_reg_canvas.style.cursor = "default";

        // update the region
        var region_id = _via_region_edge[0];
        var image_attr = _ra_regions[region_id].shape_attributes;
        var canvas_attr = _via_canvas_regions[region_id].shape_attributes;

        switch (canvas_attr['name']) {
            case VIA_REGION_SHAPE.RECT:
                var d = [canvas_attr['x'], canvas_attr['y'], 0, 0];
                d[2] = d[0] + canvas_attr['width'];
                d[3] = d[1] + canvas_attr['height'];

                var mx = _via_current_x;
                var my = _via_current_y;
                var preserve_aspect_ratio = false;

                // constrain (mx,my) to lie on a line connecting a diagonal of rectangle
                if (_via_is_ctrl_pressed) {
                    preserve_aspect_ratio = true;
                }

                rect_update_corner(_via_region_edge[1], d, mx, my, preserve_aspect_ratio);
                rect_standardize_coordinates(d);

                var w = Math.abs(d[2] - d[0]);
                var h = Math.abs(d[3] - d[1]);

                image_attr['x'] = Math.round(d[0] * _via_canvas_scale);
                image_attr['y'] = Math.round(d[1] * _via_canvas_scale);
                image_attr['width'] = Math.round(w * _via_canvas_scale);
                image_attr['height'] = Math.round(h * _via_canvas_scale);

                canvas_attr['x'] = Math.round(image_attr['x'] / _via_canvas_scale);
                canvas_attr['y'] = Math.round(image_attr['y'] / _via_canvas_scale);
                canvas_attr['width'] = Math.round(image_attr['width'] / _via_canvas_scale);
                canvas_attr['height'] = Math.round(image_attr['height'] / _via_canvas_scale);
                break;

            case VIA_REGION_SHAPE.CIRCLE:
                var dx = Math.abs(canvas_attr['cx'] - _via_current_x);
                var dy = Math.abs(canvas_attr['cy'] - _via_current_y);
                var new_r = Math.sqrt(dx * dx + dy * dy);

                image_attr['r'] = fixfloat(new_r * _via_canvas_scale);
                canvas_attr['r'] = Math.round(image_attr['r'] / _via_canvas_scale);
                break;

            case VIA_REGION_SHAPE.ELLIPSE:
                var new_rx = canvas_attr['rx'];
                var new_ry = canvas_attr['ry'];
                var new_theta = canvas_attr['theta'];
                var dx = Math.abs(canvas_attr['cx'] - _via_current_x);
                var dy = Math.abs(canvas_attr['cy'] - _via_current_y);

                switch (_via_region_edge[1]) {
                    case 5:
                        new_ry = Math.sqrt(dx * dx + dy * dy);
                        new_theta = Math.atan2(-(_via_current_x - canvas_attr['cx']), (_via_current_y - canvas_attr['cy']));
                        break;

                    case 6:
                        new_rx = Math.sqrt(dx * dx + dy * dy);
                        new_theta = Math.atan2((_via_current_y - canvas_attr['cy']), (_via_current_x - canvas_attr['cx']));
                        break;

                    default:
                        new_rx = dx;
                        new_ry = dy;
                        new_theta = 0;
                        break;
                }

                image_attr['rx'] = fixfloat(new_rx * _via_canvas_scale);
                image_attr['ry'] = fixfloat(new_ry * _via_canvas_scale);
                image_attr['theta'] = fixfloat(new_theta);

                canvas_attr['rx'] = Math.round(image_attr['rx'] / _via_canvas_scale);
                canvas_attr['ry'] = Math.round(image_attr['ry'] / _via_canvas_scale);
                canvas_attr['theta'] = fixfloat(new_theta);
                break;

            case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
            case VIA_REGION_SHAPE.POLYGON:
                var moved_vertex_id = _via_region_edge[1] - VIA_POLYGON_RESIZE_VERTEX_OFFSET;

                if (e.ctrlKey || e.metaKey) {
                    // if on vertex, delete it
                    // if on edge, add a new vertex
                    var r = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
                    var shape = r.name;
                    var is_on_vertex = is_on_polygon_vertex(r['all_points_x'], r['all_points_y'], _via_current_x, _via_current_y);

                    if (is_on_vertex === _via_region_edge[1]) {
                        // click on vertex, hence delete vertex
                        if (_via_polygon_del_vertex(region_id, moved_vertex_id)) {
                            show_message('Deleted vertex ' + moved_vertex_id + ' from region');
                        }
                    } else {
                        var is_on_edge = is_on_polygon_edge(r['all_points_x'], r['all_points_y'], _via_current_x, _via_current_y);
                        if (is_on_edge === _via_region_edge[1]) {
                            // click on edge, hence add new vertex
                            var vertex_index = is_on_edge - VIA_POLYGON_RESIZE_VERTEX_OFFSET;
                            var canvas_x0 = Math.round(_via_click_x1);
                            var canvas_y0 = Math.round(_via_click_y1);
                            var img_x0 = Math.round(canvas_x0 * _via_canvas_scale);
                            var img_y0 = Math.round(canvas_y0 * _via_canvas_scale);
                            canvas_x0 = Math.round(img_x0 / _via_canvas_scale);
                            canvas_y0 = Math.round(img_y0 / _via_canvas_scale);

                            _via_canvas_regions[region_id].shape_attributes['all_points_x'].splice(vertex_index + 1, 0, canvas_x0);
                            _via_canvas_regions[region_id].shape_attributes['all_points_y'].splice(vertex_index + 1, 0, canvas_y0);
                            _ra_regions[region_id].shape_attributes['all_points_x'].splice(vertex_index + 1, 0, img_x0);
                            _ra_regions[region_id].shape_attributes['all_points_y'].splice(vertex_index + 1, 0, img_y0);

                            show_message('Added 1 new vertex to ' + shape + ' region');
                        }
                    }
                } else {
                    // update coordinate of vertex
                    var imx = Math.round(_via_current_x * _via_canvas_scale);
                    var imy = Math.round(_via_current_y * _via_canvas_scale);
                    image_attr['all_points_x'][moved_vertex_id] = imx;
                    image_attr['all_points_y'][moved_vertex_id] = imy;
                    canvas_attr['all_points_x'][moved_vertex_id] = Math.round(imx / _via_canvas_scale);
                    canvas_attr['all_points_y'][moved_vertex_id] = Math.round(imy / _via_canvas_scale);
                }
                break;
        } // end of switch()
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
        return;
    }

    // denotes a single click (= mouse down + mouse up)
    if (click_dx < VIA_MOUSE_CLICK_TOL ||
        click_dy < VIA_MOUSE_CLICK_TOL) {
        // if user is already drawing polygon, then each click adds a new point
        if (_via_is_user_drawing_polygon) {
            var canvas_x0 = Math.round(_via_click_x1);
            var canvas_y0 = Math.round(_via_click_y1);
            var n = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'].length;
            var last_x0 = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'][n - 1];
            var last_y0 = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_y'][n - 1];
            // discard if the click was on the last vertex
            if (canvas_x0 !== last_x0 || canvas_y0 !== last_y0) {
                // user clicked on a new polygon point
                _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'].push(canvas_x0);
                _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_y'].push(canvas_y0);
            }
        } else {
            var region_id = is_inside_region(_via_click_x0, _via_click_y0);
            if (region_id >= 0) {
                // first click selects region
                _via_user_sel_region_id = region_id;
                _via_is_region_selected = true;
                _via_is_user_moving_region = false;
                _via_is_user_drawing_region = false;

                // de-select all other regions if the user has not pressed Shift
                if (!e.shiftKey) {
                    toggle_all_regions_selection(false);
                }
                set_region_select_state(region_id, true);


                // show the region info
                if (_via_is_region_info_visible) {
                    var canvas_attr = _via_canvas_regions[region_id].shape_attributes;

                    switch (canvas_attr['name']) {
                        case VIA_REGION_SHAPE.RECT:
                            break;

                        case VIA_REGION_SHAPE.CIRCLE:
                            var rf = document.getElementById('region_info');
                            var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
                            rf.innerHTML += ',' + ' Radius:' + attr['r'];
                            break;

                        case VIA_REGION_SHAPE.ELLIPSE:
                            var rf = document.getElementById('region_info');
                            var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
                            rf.innerHTML += ',' + ' X-radius:' + attr['rx'] + ',' + ' Y-radius:' + attr['ry'];
                            break;

                        case VIA_REGION_SHAPE.POLYLINE:
                        case VIA_REGION_SHAPE.POLYGON:
                            break;
                    }
                }

                show_message('Region selected. If you intended to draw a region, click again inside the selected region to start drawing a region.')
            } else {
                if (_via_is_user_drawing_region) {
                    // clear all region selection
                    _via_is_user_drawing_region = false;
                    _via_is_region_selected = false;
                    toggle_all_regions_selection(false);
                    //annotation_editor_hide();
                } else {
                    switch (_via_current_shape) {
                        case VIA_REGION_SHAPE.POLYLINE: // handled by case for POLYGON
                        case VIA_REGION_SHAPE.POLYGON:
                            // user has clicked on the first point in a new polygon
                            // see also event 'mouseup' for _via_is_user_moving_region=true
                            _via_is_user_drawing_polygon = true;

                            var canvas_polygon_region = new file_region();
                            canvas_polygon_region.shape_attributes['name'] = _via_current_shape;
                            canvas_polygon_region.shape_attributes['all_points_x'] = [Math.round(_via_click_x0)];
                            canvas_polygon_region.shape_attributes['all_points_y'] = [Math.round(_via_click_y0)];

                            var new_length = _via_canvas_regions.push(canvas_polygon_region);
                            _via_current_polygon_region_id = new_length - 1;
                            break;

                        case VIA_REGION_SHAPE.POINT:
                            // user has marked a landmark point
                            var point_region = new file_region();
                            point_region.shape_attributes['name'] = VIA_REGION_SHAPE.POINT;
                            point_region.shape_attributes['cx'] = Math.round(_via_click_x0 * _via_canvas_scale);
                            point_region.shape_attributes['cy'] = Math.round(_via_click_y0 * _via_canvas_scale);
                            _ra_regions.push(point_region);

                            var canvas_point_region = new file_region();
                            canvas_point_region.shape_attributes['name'] = VIA_REGION_SHAPE.POINT;
                            canvas_point_region.shape_attributes['cx'] = Math.round(_via_click_x0);
                            canvas_point_region.shape_attributes['cy'] = Math.round(_via_click_y0);
                            _via_canvas_regions.push(canvas_point_region);


                            break;
                    }
                }
            }
        }
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
        return;
    }

    // indicates that user has finished drawing a new region
    if (_via_is_user_drawing_region) {
        _via_is_user_drawing_region = false;
        var region_x0 = _via_click_x0;
        var region_y0 = _via_click_y0;
        var region_x1 = _via_click_x1;
        var region_y1 = _via_click_y1;

        var original_img_region = new file_region();
        var canvas_img_region = new file_region();
        var region_dx = Math.abs(region_x1 - region_x0);
        var region_dy = Math.abs(region_y1 - region_y0);
        var new_region_added = false;

        if (region_dx > VIA_REGION_MIN_DIM && region_dy > VIA_REGION_MIN_DIM) { // avoid regions with 0 dim
            switch (_via_current_shape) {
                case VIA_REGION_SHAPE.RECT:
                    // ensure that (x0,y0) is top-left and (x1,y1) is bottom-right
                    if (_via_click_x0 < _via_click_x1) {
                        region_x0 = _via_click_x0;
                        region_x1 = _via_click_x1;
                    } else {
                        region_x0 = _via_click_x1;
                        region_x1 = _via_click_x0;
                    }

                    if (_via_click_y0 < _via_click_y1) {
                        region_y0 = _via_click_y0;
                        region_y1 = _via_click_y1;
                    } else {
                        region_y0 = _via_click_y1;
                        region_y1 = _via_click_y0;
                    }

                    var x = Math.round(region_x0 * _via_canvas_scale);
                    var y = Math.round(region_y0 * _via_canvas_scale);
                    var width = Math.round(region_dx * _via_canvas_scale);
                    var height = Math.round(region_dy * _via_canvas_scale);
                    original_img_region.shape_attributes['name'] = 'rect';
                    original_img_region.shape_attributes['x'] = x;
                    original_img_region.shape_attributes['y'] = y;
                    original_img_region.shape_attributes['width'] = width;
                    original_img_region.shape_attributes['height'] = height;

                    canvas_img_region.shape_attributes['name'] = 'rect';
                    canvas_img_region.shape_attributes['x'] = Math.round(x / _via_canvas_scale);
                    canvas_img_region.shape_attributes['y'] = Math.round(y / _via_canvas_scale);
                    canvas_img_region.shape_attributes['width'] = Math.round(width / _via_canvas_scale);
                    canvas_img_region.shape_attributes['height'] = Math.round(height / _via_canvas_scale);

                    new_region_added = true;
                    break;

                case VIA_REGION_SHAPE.CIRCLE:
                    var cx = Math.round(region_x0 * _via_canvas_scale);
                    var cy = Math.round(region_y0 * _via_canvas_scale);
                    var r = Math.round(Math.sqrt(region_dx * region_dx + region_dy * region_dy) * _via_canvas_scale);

                    original_img_region.shape_attributes['name'] = 'circle';
                    original_img_region.shape_attributes['cx'] = cx;
                    original_img_region.shape_attributes['cy'] = cy;
                    original_img_region.shape_attributes['r'] = r;

                    canvas_img_region.shape_attributes['name'] = 'circle';
                    canvas_img_region.shape_attributes['cx'] = Math.round(cx / _via_canvas_scale);
                    canvas_img_region.shape_attributes['cy'] = Math.round(cy / _via_canvas_scale);
                    canvas_img_region.shape_attributes['r'] = Math.round(r / _via_canvas_scale);

                    new_region_added = true;
                    break;

                case VIA_REGION_SHAPE.ELLIPSE:
                    var cx = Math.round(region_x0 * _via_canvas_scale);
                    var cy = Math.round(region_y0 * _via_canvas_scale);
                    var rx = Math.round(region_dx * _via_canvas_scale);
                    var ry = Math.round(region_dy * _via_canvas_scale);
                    var theta = 0;

                    original_img_region.shape_attributes['name'] = 'ellipse';
                    original_img_region.shape_attributes['cx'] = cx;
                    original_img_region.shape_attributes['cy'] = cy;
                    original_img_region.shape_attributes['rx'] = rx;
                    original_img_region.shape_attributes['ry'] = ry;
                    original_img_region.shape_attributes['theta'] = theta;

                    canvas_img_region.shape_attributes['name'] = 'ellipse';
                    canvas_img_region.shape_attributes['cx'] = Math.round(cx / _via_canvas_scale);
                    canvas_img_region.shape_attributes['cy'] = Math.round(cy / _via_canvas_scale);
                    canvas_img_region.shape_attributes['rx'] = Math.round(rx / _via_canvas_scale);
                    canvas_img_region.shape_attributes['ry'] = Math.round(ry / _via_canvas_scale);
                    canvas_img_region.shape_attributes['theta'] = theta;

                    new_region_added = true;
                    break;

                case VIA_REGION_SHAPE.POINT: // handled by case VIA_REGION_SHAPE.POLYGON
                case VIA_REGION_SHAPE.POLYLINE: // handled by case VIA_REGION_SHAPE.POLYGON
                case VIA_REGION_SHAPE.POLYGON:
                    // handled by _via_is_user_drawing_polygon
                    break;
            } // end of switch

            if (new_region_added) {
                var n1 = _ra_regions.push(original_img_region);
                var n2 = _via_canvas_regions.push(canvas_img_region);

                if (n1 !== n2) {
                    console.log('_via_img_metadata.regions[' + n1 + '] and _via_canvas_regions[' + n2 + '] count mismatch');
                }
                var new_region_id = n1 - 1;

                //set_region_annotations_to_default_value( new_region_id );
                select_only_region(new_region_id);
            }
            _via_redraw_reg_canvas();
            _via_reg_canvas.focus();
        } else {
            show_message('Prevented accidental addition of a very small region.');
        }
        return;
    }
}

function _via_reg_canvas_mouseover_handler(e) {
    // change the mouse cursor icon
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
}

function _via_reg_canvas_mousemove_handler(e) {
    if (!_via_current_image_loaded) {
        return;
    }

    _via_current_x = e.offsetX;
    _via_current_y = e.offsetY;

    // display the cursor coordinates
    var rf = document.getElementById('region_info');
    if (rf != null && _via_is_region_info_visible) {
        var img_x = Math.round(_via_current_x * _via_canvas_scale);
        var img_y = Math.round(_via_current_y * _via_canvas_scale);
        rf.innerHTML = 'X:' + img_x + ',' + ' Y:' + img_y;
    }

    if (_via_is_region_selected) {
        // display the region's info if a region is selected
        if (rf != null && _via_is_region_info_visible && _via_user_sel_region_id !== -1) {
            var canvas_attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
            switch (canvas_attr['name']) {
                case VIA_REGION_SHAPE.RECT:
                    break;

                case VIA_REGION_SHAPE.CIRCLE:
                    var rf = document.getElementById('region_info');
                    var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
                    rf.innerHTML += ',' + ' Radius:' + attr['r'];
                    break;

                case VIA_REGION_SHAPE.ELLIPSE:
                    var rf = document.getElementById('region_info');
                    var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
                    rf.innerHTML += ',' + ' X-radius:' + attr['rx'] + ',' + ' Y-radius:' + attr['ry'];
                    break;

                case VIA_REGION_SHAPE.POLYLINE:
                case VIA_REGION_SHAPE.POLYGON:
                    break;
            }
        }

        if (!_via_is_user_resizing_region) {
            // check if user moved mouse cursor to region boundary
            // which indicates an intention to resize the region
            _via_region_edge = is_on_region_corner(_via_current_x, _via_current_y);

            if (_via_region_edge[0] === _via_user_sel_region_id) {
                switch (_via_region_edge[1]) {
                    // rect
                    case 1: // Fall-through // top-left corner of rect
                    case 3: // bottom-right corner of rect
                        _via_reg_canvas.style.cursor = "nwse-resize";
                        break;
                    case 2: // Fall-through // top-right corner of rect
                    case 4: // bottom-left corner of rect
                        _via_reg_canvas.style.cursor = "nesw-resize";
                        break;

                    case 5: // Fall-through // top-middle point of rect
                    case 7: // bottom-middle point of rect
                        _via_reg_canvas.style.cursor = "ns-resize";
                        break;
                    case 6: // Fall-through // top-middle point of rect
                    case 8: // bottom-middle point of rect
                        _via_reg_canvas.style.cursor = "ew-resize";
                        break;

                        // circle and ellipse
                    case 5:
                        _via_reg_canvas.style.cursor = "n-resize";
                        break;
                    case 6:
                        _via_reg_canvas.style.cursor = "e-resize";
                        break;

                    default:
                        _via_reg_canvas.style.cursor = "default";
                        break;
                }

                if (_via_region_edge[1] >= VIA_POLYGON_RESIZE_VERTEX_OFFSET) {
                    // indicates mouse over polygon vertex
                    _via_reg_canvas.style.cursor = "crosshair";
                    show_message('To move vertex, simply drag the vertex. To add vertex, press [Ctrl] key and click on the edge. To delete vertex, press [Ctrl] (or [Command]) key and click on vertex.');
                }
            } else {
                var yes = is_inside_this_region(_via_current_x,
                    _via_current_y,
                    _via_user_sel_region_id);
                if (yes) {
                    _via_reg_canvas.style.cursor = "move";
                } else {
                    _via_reg_canvas.style.cursor = "default";
                }

            }
        }
    }

    if (_via_is_user_drawing_region) {
        // draw region as the user drags the mouse cursor
        if (_via_canvas_regions.length) {
            _via_redraw_reg_canvas(); // clear old intermediate rectangle
        } else {
            // first region being drawn, just clear the full region canvas
            _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
        }

        var region_x0 = _via_click_x0;
        var region_y0 = _via_click_y0;

        var dx = Math.round(Math.abs(_via_current_x - _via_click_x0));
        var dy = Math.round(Math.abs(_via_current_y - _via_click_y0));
        _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;

        switch (_via_current_shape) {
            case VIA_REGION_SHAPE.RECT:
                if (_via_click_x0 < _via_current_x) {
                    if (_via_click_y0 < _via_current_y) {
                        region_x0 = _via_click_x0;
                        region_y0 = _via_click_y0;
                    } else {
                        region_x0 = _via_click_x0;
                        region_y0 = _via_current_y;
                    }
                } else {
                    if (_via_click_y0 < _via_current_y) {
                        region_x0 = _via_current_x;
                        region_y0 = _via_click_y0;
                    } else {
                        region_x0 = _via_current_x;
                        region_y0 = _via_current_y;
                    }
                }

                _via_draw_rect_region(region_x0, region_y0, dx, dy, false);

                // display the current region info
                if (rf != null && _via_is_region_info_visible) {
                    rf.innerHTML += ',' + ' W:' + dx + ',' + ' H:' + dy;
                }
                break;

            case VIA_REGION_SHAPE.CIRCLE:
                var circle_radius = Math.round(Math.sqrt(dx * dx + dy * dy));
                _via_draw_circle_region(region_x0, region_y0, circle_radius, false);

                // display the current region info
                if (rf != null && _via_is_region_info_visible) {
                    rf.innerHTML += ',' + ' Radius:' + circle_radius;
                }
                break;

            case VIA_REGION_SHAPE.ELLIPSE:
                _via_draw_ellipse_region(region_x0, region_y0, dx, dy, 0, false);

                // display the current region info
                if (rf != null && _via_is_region_info_visible) {
                    rf.innerHTML += ',' + ' X-radius:' + fixfloat(dx) + ',' + ' Y-radius:' + fixfloat(dy);
                }
                break;

            case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
            case VIA_REGION_SHAPE.POLYGON:
                // this is handled by the if ( _via_is_user_drawing_polygon ) { ... }
                // see below
                break;
        }
        _via_reg_canvas.focus();
    }

    if (_via_is_user_resizing_region) {
        // user has clicked mouse on bounding box edge and is now moving it
        // draw region as the user drags the mouse coursor
        if (_via_canvas_regions.length) {
            _via_redraw_reg_canvas(); // clear old intermediate rectangle
        } else {
            // first region being drawn, just clear the full region canvas
            _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
        }

        var region_id = _via_region_edge[0];
        var attr = _via_canvas_regions[region_id].shape_attributes;
        switch (attr['name']) {
            case VIA_REGION_SHAPE.RECT:
                // original rectangle
                var d = [attr['x'], attr['y'], 0, 0];
                d[2] = d[0] + attr['width'];
                d[3] = d[1] + attr['height'];

                var mx = _via_current_x;
                var my = _via_current_y;
                var preserve_aspect_ratio = false;
                // constrain (mx,my) to lie on a line connecting a diagonal of rectangle
                if (_via_is_ctrl_pressed) {
                    preserve_aspect_ratio = true;
                }

                rect_update_corner(_via_region_edge[1], d, mx, my, preserve_aspect_ratio);
                rect_standardize_coordinates(d);

                var w = Math.abs(d[2] - d[0]);
                var h = Math.abs(d[3] - d[1]);
                _via_draw_rect_region(d[0], d[1], w, h, true);

                if (rf != null && _via_is_region_info_visible) {
                    rf.innerHTML += ',' + ' W:' + w + ',' + ' H:' + h;
                }
                break;

            case VIA_REGION_SHAPE.CIRCLE:
                var dx = Math.abs(attr['cx'] - _via_current_x);
                var dy = Math.abs(attr['cy'] - _via_current_y);
                var new_r = Math.sqrt(dx * dx + dy * dy);
                _via_draw_circle_region(attr['cx'],
                    attr['cy'],
                    new_r,
                    true);
                if (rf != null && _via_is_region_info_visible) {
                    var curr_texts = rf.innerHTML.split(",");
                    rf.innerHTML = "";
                    rf.innerHTML += curr_texts[0] + ',' + curr_texts[1] + ',' + ' Radius:' + Math.round(new_r);
                }
                break;

            case VIA_REGION_SHAPE.ELLIPSE:
                var new_rx = attr['rx'];
                var new_ry = attr['ry'];
                var new_theta = attr['theta'];
                var dx = Math.abs(attr['cx'] - _via_current_x);
                var dy = Math.abs(attr['cy'] - _via_current_y);
                switch (_via_region_edge[1]) {
                    case 5:
                        new_ry = Math.sqrt(dx * dx + dy * dy);
                        new_theta = Math.atan2(-(_via_current_x - attr['cx']), (_via_current_y - attr['cy']));
                        break;

                    case 6:
                        new_rx = Math.sqrt(dx * dx + dy * dy);
                        new_theta = Math.atan2((_via_current_y - attr['cy']), (_via_current_x - attr['cx']));
                        break;

                    default:
                        new_rx = dx;
                        new_ry = dy;
                        new_theta = 0;
                        break;
                }

                _via_draw_ellipse_region(attr['cx'],
                    attr['cy'],
                    new_rx,
                    new_ry,
                    new_theta,
                    true);
                if (rf != null && _via_is_region_info_visible) {
                    var curr_texts = rf.innerHTML.split(",");
                    rf.innerHTML = "";
                    rf.innerHTML = curr_texts[0] + ',' + curr_texts[1] + ',' + ' X-radius:' + fixfloat(new_rx) + ',' + ' Y-radius:' + fixfloat(new_ry);
                }
                break;

            case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
            case VIA_REGION_SHAPE.POLYGON:
                var moved_all_points_x = attr['all_points_x'].slice(0);
                var moved_all_points_y = attr['all_points_y'].slice(0);
                var moved_vertex_id = _via_region_edge[1] - VIA_POLYGON_RESIZE_VERTEX_OFFSET;

                moved_all_points_x[moved_vertex_id] = _via_current_x;
                moved_all_points_y[moved_vertex_id] = _via_current_y;

                _via_draw_polygon_region(moved_all_points_x,
                    moved_all_points_y,
                    true,
                    attr['name']);
                if (rf != null && _via_is_region_info_visible) {
                    rf.innerHTML += ',' + ' Vertices:' + attr['all_points_x'].length;
                }
                break;
        }
        _via_reg_canvas.focus();
    }

    if (_via_is_user_moving_region) {
        // draw region as the user drags the mouse coursor
        if (_via_canvas_regions.length) {
            _via_redraw_reg_canvas(); // clear old intermediate rectangle
        } else {
            // first region being drawn, just clear the full region canvas
            _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
        }

        var move_x = (_via_current_x - _via_region_click_x);
        var move_y = (_via_current_y - _via_region_click_y);
        var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;

        switch (attr['name']) {
            case VIA_REGION_SHAPE.RECT:
                _via_draw_rect_region(attr['x'] + move_x,
                    attr['y'] + move_y,
                    attr['width'],
                    attr['height'],
                    true);
                // display the current region info
                if (rf != null && _via_is_region_info_visible) {
                    rf.innerHTML += ',' + ' W:' + attr['width'] + ',' + ' H:' + attr['height'];
                }
                break;

            case VIA_REGION_SHAPE.CIRCLE:
                _via_draw_circle_region(attr['cx'] + move_x,
                    attr['cy'] + move_y,
                    attr['r'],
                    true);
                break;

            case VIA_REGION_SHAPE.ELLIPSE:
                if (typeof (attr['theta']) === 'undefined') {
                    attr['theta'] = 0;
                }
                _via_draw_ellipse_region(attr['cx'] + move_x,
                    attr['cy'] + move_y,
                    attr['rx'],
                    attr['ry'],
                    attr['theta'],
                    true);
                break;

            case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
            case VIA_REGION_SHAPE.POLYGON:
                var moved_all_points_x = attr['all_points_x'].slice(0);
                var moved_all_points_y = attr['all_points_y'].slice(0);
                for (var i = 0; i < moved_all_points_x.length; ++i) {
                    moved_all_points_x[i] += move_x;
                    moved_all_points_y[i] += move_y;
                }
                _via_draw_polygon_region(moved_all_points_x,
                    moved_all_points_y,
                    true,
                    attr['name']);
                if (rf != null && _via_is_region_info_visible) {
                    rf.innerHTML += ',' + ' Vertices:' + attr['all_points_x'].length;
                }
                break;

            case VIA_REGION_SHAPE.POINT:
                _via_draw_point_region(attr['cx'] + move_x,
                    attr['cy'] + move_y,
                    true);
                break;
        }
        _via_reg_canvas.focus();
        //annotation_editor_hide() // moving
        return;
    }

    if (_via_is_user_drawing_polygon) {
        _via_redraw_reg_canvas();
        var attr = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes;
        var all_points_x = attr['all_points_x'];
        var all_points_y = attr['all_points_y'];
        var npts = all_points_x.length;

        if (npts > 0) {
            var line_x = [all_points_x.slice(npts - 1), _via_current_x];
            var line_y = [all_points_y.slice(npts - 1), _via_current_y];
            _via_draw_polygon_region(line_x, line_y, false, attr['name']);
        }

        if (rf != null && _via_is_region_info_visible) {
            rf.innerHTML += ',' + ' Vertices:' + npts;
        }
    }
}

function _via_move_selected_regions(move_x, move_y) {
    var i, n;
    n = _via_region_selected_flag.length;
    for (i = 0; i < n; ++i) {
        if (_via_region_selected_flag[i]) {
            _via_move_region(i, move_x, move_y);
        }
    }
}

function _via_validate_move_region(x, y, canvas_attr) {
    switch (canvas_attr['name']) {
        case VIA_REGION_SHAPE.RECT:
            // left and top boundary check
            if (x < 0 || y < 0) {
                show_message('Region moved beyond image boundary. Resetting.');
                return false;
            }
            // right and bottom boundary check
            if ((y + canvas_attr['height']) > _via_current_image_height ||
                (x + canvas_attr['width']) > _via_current_image_width) {
                show_message('Region moved beyond image boundary. Resetting.');
                return false;
            }

            // same validation for all
            case VIA_REGION_SHAPE.CIRCLE:
            case VIA_REGION_SHAPE.ELLIPSE:
            case VIA_REGION_SHAPE.POINT:
            case VIA_REGION_SHAPE.POLYLINE:
            case VIA_REGION_SHAPE.POLYGON:
                if (x < 0 || y < 0 ||
                    x > _via_current_image_width || y > _via_current_image_height) {
                    show_message('Region moved beyond image boundary. Resetting.');
                    return false;
                }
    }
    return true;
}

function _via_move_region(region_id, move_x, move_y) {
    var image_attr = _ra_regions[region_id].shape_attributes;
    var canvas_attr = _via_canvas_regions[region_id].shape_attributes;

    switch (canvas_attr['name']) {
        case VIA_REGION_SHAPE.RECT:
            var xnew = image_attr['x'] + Math.round(move_x * _via_canvas_scale);
            var ynew = image_attr['y'] + Math.round(move_y * _via_canvas_scale);

            var is_valid = _via_validate_move_region(xnew, ynew, image_attr);
            if (!is_valid) {
                break;
            }

            image_attr['x'] = xnew;
            image_attr['y'] = ynew;

            canvas_attr['x'] = Math.round(image_attr['x'] / _via_canvas_scale);
            canvas_attr['y'] = Math.round(image_attr['y'] / _via_canvas_scale);
            break;

        case VIA_REGION_SHAPE.CIRCLE: // Fall-through
        case VIA_REGION_SHAPE.ELLIPSE: // Fall-through
        case VIA_REGION_SHAPE.POINT:
            var cxnew = image_attr['cx'] + Math.round(move_x * _via_canvas_scale);
            var cynew = image_attr['cy'] + Math.round(move_y * _via_canvas_scale);

            var is_valid = _via_validate_move_region(cxnew, cynew, image_attr);
            if (!is_valid) {
                break;
            }

            image_attr['cx'] = cxnew;
            image_attr['cy'] = cynew;

            canvas_attr['cx'] = Math.round(image_attr['cx'] / _via_canvas_scale);
            canvas_attr['cy'] = Math.round(image_attr['cy'] / _via_canvas_scale);
            break;

        case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
        case VIA_REGION_SHAPE.POLYGON:
            var img_px = image_attr['all_points_x'];
            var img_py = image_attr['all_points_y'];
            var canvas_px = canvas_attr['all_points_x'];
            var canvas_py = canvas_attr['all_points_y'];
            // clone for reverting if valiation fails
            var img_px_old = Object.assign({}, img_px);
            var img_py_old = Object.assign({}, img_py);

            // validate move
            for (var i = 0; i < img_px.length; ++i) {
                var pxnew = img_px[i] + Math.round(move_x * _via_canvas_scale);
                var pynew = img_py[i] + Math.round(move_y * _via_canvas_scale);
                if (!_via_validate_move_region(pxnew, pynew, image_attr)) {
                    img_px = img_px_old;
                    img_py = img_py_old;
                    break;
                }
            }
            // move points
            for (var i = 0; i < img_px.length; ++i) {
                img_px[i] = img_px[i] + Math.round(move_x * _via_canvas_scale);
                img_py[i] = img_py[i] + Math.round(move_y * _via_canvas_scale);
            }

            for (var i = 0; i < canvas_px.length; ++i) {
                canvas_px[i] = Math.round(img_px[i] / _via_canvas_scale);
                canvas_py[i] = Math.round(img_py[i] / _via_canvas_scale);
            }
            break;
    }
}

function _via_polygon_del_vertex(region_id, vertex_id) {
    var rs = _via_canvas_regions[region_id].shape_attributes;
    var npts = rs['all_points_x'].length;
    var shape = rs['name'];
    if (shape !== VIA_REGION_SHAPE.POLYGON && shape !== VIA_REGION_SHAPE.POLYLINE) {
        show_message('Vertices can only be deleted from polygon/polyline.');
        return false;
    }
    if (npts <= 3 && shape === VIA_REGION_SHAPE.POLYGON) {
        show_message('Failed to delete vertex because a polygon must have at least 3 vertices.');
        return false;
    }
    if (npts <= 2 && shape === VIA_REGION_SHAPE.POLYLINE) {
        show_message('Failed to delete vertex because a polyline must have at least 2 vertices.');
        return false;
    }
    // delete vertex from canvas
    _via_canvas_regions[region_id].shape_attributes['all_points_x'].splice(vertex_id, 1);
    _via_canvas_regions[region_id].shape_attributes['all_points_y'].splice(vertex_id, 1);

    // delete vertex from image metadata
    _ra_regions[region_id].shape_attributes['all_points_x'].splice(vertex_id, 1);
    _ra_regions[region_id].shape_attributes['all_points_y'].splice(vertex_id, 1);
    return true;
}

//
// Canvas update routines
//
function _via_redraw_reg_canvas() {
    _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
    if (_via_canvas_regions.length > 0) {
        if (_via_is_region_boundary_visible) {
            draw_all_regions();
        }
        if (_via_is_region_id_visible) {
            draw_all_region_id();
        }
    }
}

function _via_clear_reg_canvas() {
    _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
}

function draw_all_regions() {
    var aid = _via_settings.ui.image.region_color;
    var attr, is_selected, aid, avalue;
    for (var i = 0; i < _via_canvas_regions.length; ++i) {
        attr = _via_canvas_regions[i].shape_attributes;
        is_selected = _via_region_selected_flag[i];

        // region stroke style may depend on attribute value
        _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;
        if (!_via_is_user_drawing_polygon &&
            aid !== '__via_default_region_color__') {
            avalue = _ra_regions[i].region_attributes[aid];
            if (_via_canvas_regions_group_color.hasOwnProperty(avalue)) {
                _via_reg_ctx.strokeStyle = _via_canvas_regions_group_color[avalue];
            }
        }

        switch (attr['name']) {
            case VIA_REGION_SHAPE.RECT:
                _via_draw_rect_region(attr['x'],
                    attr['y'],
                    attr['width'],
                    attr['height'],
                    is_selected);
                break;

            case VIA_REGION_SHAPE.CIRCLE:
                _via_draw_circle_region(attr['cx'],
                    attr['cy'],
                    attr['r'],
                    is_selected);
                break;

            case VIA_REGION_SHAPE.ELLIPSE:
                if (typeof (attr['theta']) === 'undefined') {
                    attr['theta'] = 0;
                }
                _via_draw_ellipse_region(attr['cx'],
                    attr['cy'],
                    attr['rx'],
                    attr['ry'],
                    attr['theta'],
                    is_selected);
                break;

            case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
            case VIA_REGION_SHAPE.POLYGON:
                _via_draw_polygon_region(attr['all_points_x'],
                    attr['all_points_y'],
                    is_selected,
                    attr['name']);
                break;

            case VIA_REGION_SHAPE.POINT:
                _via_draw_point_region(attr['cx'],
                    attr['cy'],
                    is_selected);
                break;
        }
    }
}

// control point for resize of region boundaries
function _via_draw_control_point(cx, cy) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.arc(cx, cy, VIA_REGION_SHAPES_POINTS_RADIUS, 0, 2 * Math.PI, false);
    _via_reg_ctx.closePath();

    _via_reg_ctx.fillStyle = VIA_THEME_CONTROL_POINT_COLOR;
    _via_reg_ctx.globalAlpha = 1.0;
    _via_reg_ctx.fill();
}

function _via_draw_rect_region(x, y, w, h, is_selected) {
    if (is_selected) {
        _via_draw_rect(x, y, w, h);

        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;

        _via_draw_control_point(x, y);
        _via_draw_control_point(x + w, y + h);
        _via_draw_control_point(x, y + h);
        _via_draw_control_point(x + w, y);
        _via_draw_control_point(x + w / 2, y);
        _via_draw_control_point(x + w / 2, y + h);
        _via_draw_control_point(x, y + h / 2);
        _via_draw_control_point(x + w, y + h / 2);
    } else {
        // draw a fill line
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_draw_rect(x, y, w, h);
        _via_reg_ctx.stroke();

        if (w > VIA_THEME_REGION_BOUNDARY_WIDTH &&
            h > VIA_THEME_REGION_BOUNDARY_WIDTH) {
            // draw a boundary line on both sides of the fill line
            _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
            _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 4;
            _via_draw_rect(x - VIA_THEME_REGION_BOUNDARY_WIDTH / 2,
                y - VIA_THEME_REGION_BOUNDARY_WIDTH / 2,
                w + VIA_THEME_REGION_BOUNDARY_WIDTH,
                h + VIA_THEME_REGION_BOUNDARY_WIDTH);
            _via_reg_ctx.stroke();

            _via_draw_rect(x + VIA_THEME_REGION_BOUNDARY_WIDTH / 2,
                y + VIA_THEME_REGION_BOUNDARY_WIDTH / 2,
                w - VIA_THEME_REGION_BOUNDARY_WIDTH,
                h - VIA_THEME_REGION_BOUNDARY_WIDTH);
            _via_reg_ctx.stroke();
        }
    }
}

function _via_draw_rect(x, y, w, h) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.moveTo(x, y);
    _via_reg_ctx.lineTo(x + w, y);
    _via_reg_ctx.lineTo(x + w, y + h);
    _via_reg_ctx.lineTo(x, y + h);
    _via_reg_ctx.closePath();
}

function _via_draw_circle_region(cx, cy, r, is_selected) {
    if (is_selected) {
        _via_draw_circle(cx, cy, r);

        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;

        _via_draw_control_point(cx + r, cy);
    } else {
        // draw a fill line
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_draw_circle(cx, cy, r);
        _via_reg_ctx.stroke();

        if (r > VIA_THEME_REGION_BOUNDARY_WIDTH) {
            // draw a boundary line on both sides of the fill line
            _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
            _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 4;
            _via_draw_circle(cx, cy,
                r - VIA_THEME_REGION_BOUNDARY_WIDTH / 2);
            _via_reg_ctx.stroke();
            _via_draw_circle(cx, cy,
                r + VIA_THEME_REGION_BOUNDARY_WIDTH / 2);
            _via_reg_ctx.stroke();
        }
    }
}

function _via_draw_circle(cx, cy, r) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
    _via_reg_ctx.closePath();
}

function _via_draw_ellipse_region(cx, cy, rx, ry, rr, is_selected) {
    if (is_selected) {
        _via_draw_ellipse(cx, cy, rx, ry, rr);

        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;

        _via_draw_control_point(cx + rx * Math.cos(rr), cy + rx * Math.sin(rr));
        _via_draw_control_point(cx - rx * Math.cos(rr), cy - rx * Math.sin(rr));
        _via_draw_control_point(cx + ry * Math.sin(rr), cy - ry * Math.cos(rr));
        _via_draw_control_point(cx - ry * Math.sin(rr), cy + ry * Math.cos(rr));

    } else {
        // draw a fill line
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_draw_ellipse(cx, cy, rx, ry, rr);
        _via_reg_ctx.stroke();

        if (rx > VIA_THEME_REGION_BOUNDARY_WIDTH &&
            ry > VIA_THEME_REGION_BOUNDARY_WIDTH) {
            // draw a boundary line on both sides of the fill line
            _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
            _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 4;
            _via_draw_ellipse(cx, cy,
                rx + VIA_THEME_REGION_BOUNDARY_WIDTH / 2,
                ry + VIA_THEME_REGION_BOUNDARY_WIDTH / 2,
                rr);
            _via_reg_ctx.stroke();
            _via_draw_ellipse(cx, cy,
                rx - VIA_THEME_REGION_BOUNDARY_WIDTH / 2,
                ry - VIA_THEME_REGION_BOUNDARY_WIDTH / 2,
                rr);
            _via_reg_ctx.stroke();
        }
    }
}

function _via_draw_ellipse(cx, cy, rx, ry, rr) {
    _via_reg_ctx.save();

    _via_reg_ctx.beginPath();
    _via_reg_ctx.ellipse(cx, cy, rx, ry, rr, 0, 2 * Math.PI);

    _via_reg_ctx.restore(); // restore to original state
    _via_reg_ctx.closePath();
}

function _via_draw_polygon_region(all_points_x, all_points_y, is_selected, shape) {
    if (is_selected) {
        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_reg_ctx.beginPath();
        _via_reg_ctx.moveTo(all_points_x[0], all_points_y[0]);
        for (var i = 1; i < all_points_x.length; ++i) {
            _via_reg_ctx.lineTo(all_points_x[i], all_points_y[i]);
        }
        if (shape === VIA_REGION_SHAPE.POLYGON) {
            _via_reg_ctx.lineTo(all_points_x[0], all_points_y[0]); // close loop
        }
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;
        for (var i = 0; i < all_points_x.length; ++i) {
            _via_draw_control_point(all_points_x[i], all_points_y[i]);
        }
    } else {
        // draw a fill line
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_reg_ctx.beginPath();
        _via_reg_ctx.moveTo(all_points_x[0], all_points_y[0]);
        for (var i = 0; i < all_points_x.length; ++i) {
            _via_reg_ctx.lineTo(all_points_x[i], all_points_y[i]);
        }
        if (shape === VIA_REGION_SHAPE.POLYGON) {
            _via_reg_ctx.lineTo(all_points_x[0], all_points_y[0]); // close loop
        }
        _via_reg_ctx.stroke();
    }
}

function _via_draw_point_region(cx, cy, is_selected) {
    if (is_selected) {
        _via_draw_point(cx, cy, VIA_REGION_POINT_RADIUS);

        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;
    } else {
        // draw a fill line
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 2;
        _via_draw_point(cx, cy, VIA_REGION_POINT_RADIUS);
        _via_reg_ctx.stroke();

        // draw a boundary line on both sides of the fill line
        _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH / 4;
        _via_draw_point(cx, cy,
            VIA_REGION_POINT_RADIUS - VIA_THEME_REGION_BOUNDARY_WIDTH / 2);
        _via_reg_ctx.stroke();
        _via_draw_point(cx, cy,
            VIA_REGION_POINT_RADIUS + VIA_THEME_REGION_BOUNDARY_WIDTH / 2);
        _via_reg_ctx.stroke();
    }
}

function _via_draw_point(cx, cy, r) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
    _via_reg_ctx.closePath();
}

function draw_all_region_id() {
    _via_reg_ctx.shadowColor = "transparent";
    _via_reg_ctx.font = _via_settings.ui.image.region_label_font;
    for (var i = 0; i < _ra_regions.length; ++i) {
        var canvas_reg = _via_canvas_regions[i];

        var bbox = get_region_bounding_box(canvas_reg);
        var x = bbox[0];
        var y = bbox[1];
        var w = Math.abs(bbox[2] - bbox[0]);

        var char_width = _via_reg_ctx.measureText('M').width;
        var char_height = 1.8 * char_width;

        var annotation_str = (i + 1).toString();
        var rattr = _ra_regions[i].region_attributes[_via_settings.ui.image.region_label];
        var rshape = _ra_regions[i].shape_attributes['name'];
        if (_via_settings.ui.image.region_label !== '__via_region_id__') {
            if (typeof (rattr) !== 'undefined') {
                switch (typeof (rattr)) {
                    default:
                    case 'string':
                        annotation_str = rattr;
                        break;
                    case 'object':
                        annotation_str = Object.keys(rattr).join(',');
                        break;
                }
            } else {
                annotation_str = 'undefined';
            }
        }

        var bgnd_rect_width;
        var strw = _via_reg_ctx.measureText(annotation_str).width;
        if (strw > w) {
            if (_via_settings.ui.image.region_label === '__via_region_id__') {
                // region-id is always visible in full
                bgnd_rect_width = strw + char_width;
            } else {

                // if text overflows, crop it
                var str_max = Math.floor((w * annotation_str.length) / strw);
                if (str_max > 1) {
                    annotation_str = annotation_str.substr(0, str_max - 1) + '.';
                    bgnd_rect_width = w;
                } else {
                    annotation_str = annotation_str.substr(0, 1) + '.';
                    bgnd_rect_width = 2 * char_width;
                }
            }
        } else {
            bgnd_rect_width = strw + char_width;
        }

        if (canvas_reg.shape_attributes['name'] === VIA_REGION_SHAPE.POLYGON ||
            canvas_reg.shape_attributes['name'] === VIA_REGION_SHAPE.POLYLINE) {
            // put label near the first vertex
            x = canvas_reg.shape_attributes['all_points_x'][0];
            y = canvas_reg.shape_attributes['all_points_y'][0];
        } else {
            // center the label
            x = x - (bgnd_rect_width / 2 - w / 2);
        }

        // ensure that the text is within the image boundaries
        if (y < char_height) {
            y = char_height;
        }

        // first, draw a background rectangle first
        _via_reg_ctx.fillStyle = 'black';
        _via_reg_ctx.globalAlpha = 0.8;
        _via_reg_ctx.fillRect(Math.floor(x),
            Math.floor(y - 1.1 * char_height),
            Math.floor(bgnd_rect_width),
            Math.floor(char_height));

        // then, draw text over this background rectangle
        _via_reg_ctx.globalAlpha = 1.0;
        _via_reg_ctx.fillStyle = 'yellow';
        _via_reg_ctx.fillText(annotation_str,
            Math.floor(x + 0.4 * char_width),
            Math.floor(y - 0.35 * char_height));

    }
}

function get_region_bounding_box(region) {
    var d = region.shape_attributes;
    var bbox = new Array(4);

    switch (d['name']) {
        case 'rect':
            bbox[0] = d['x'];
            bbox[1] = d['y'];
            bbox[2] = d['x'] + d['width'];
            bbox[3] = d['y'] + d['height'];
            break;

        case 'circle':
            bbox[0] = d['cx'] - d['r'];
            bbox[1] = d['cy'] - d['r'];
            bbox[2] = d['cx'] + d['r'];
            bbox[3] = d['cy'] + d['r'];
            break;

        case 'ellipse':
            let radians = d['theta'];
            let radians90 = radians + Math.PI / 2;
            let ux = d['rx'] * Math.cos(radians);
            let uy = d['rx'] * Math.sin(radians);
            let vx = d['ry'] * Math.cos(radians90);
            let vy = d['ry'] * Math.sin(radians90);

            let width = Math.sqrt(ux * ux + vx * vx) * 2;
            let height = Math.sqrt(uy * uy + vy * vy) * 2;

            bbox[0] = d['cx'] - (width / 2);
            bbox[1] = d['cy'] - (height / 2);
            bbox[2] = d['cx'] + (width / 2);
            bbox[3] = d['cy'] + (height / 2);
            break;

        case 'polyline': // handled by polygon
        case 'polygon':
            var all_points_x = d['all_points_x'];
            var all_points_y = d['all_points_y'];

            var minx = Number.MAX_SAFE_INTEGER;
            var miny = Number.MAX_SAFE_INTEGER;
            var maxx = 0;
            var maxy = 0;
            for (var i = 0; i < all_points_x.length; ++i) {
                if (all_points_x[i] < minx) {
                    minx = all_points_x[i];
                }
                if (all_points_x[i] > maxx) {
                    maxx = all_points_x[i];
                }
                if (all_points_y[i] < miny) {
                    miny = all_points_y[i];
                }
                if (all_points_y[i] > maxy) {
                    maxy = all_points_y[i];
                }
            }
            bbox[0] = minx;
            bbox[1] = miny;
            bbox[2] = maxx;
            bbox[3] = maxy;
            break;

        case 'point':
            bbox[0] = d['cx'] - VIA_REGION_POINT_RADIUS;
            bbox[1] = d['cy'] - VIA_REGION_POINT_RADIUS;
            bbox[2] = d['cx'] + VIA_REGION_POINT_RADIUS;
            bbox[3] = d['cy'] + VIA_REGION_POINT_RADIUS;
            break;
    }
    return bbox;
}

//
// Region collision routines
//
function is_inside_region(px, py, descending_order) {
    var N = _via_canvas_regions.length;
    if (N === 0) {
        return -1;
    }
    var start, end, del;
    // traverse the canvas regions in alternating ascending
    // and descending order to solve the issue of nested regions
    if (descending_order) {
        start = N - 1;
        end = -1;
        del = -1;
    } else {
        start = 0;
        end = N;
        del = 1;
    }

    var i = start;
    while (i !== end) {
        var yes = is_inside_this_region(px, py, i);
        if (yes) {
            return i;
        }
        i = i + del;
    }
    return -1;
}

function is_inside_this_region(px, py, region_id) {
    var attr = _via_canvas_regions[region_id].shape_attributes;
    var result = false;
    switch (attr['name']) {
        case VIA_REGION_SHAPE.RECT:
            result = is_inside_rect(attr['x'],
                attr['y'],
                attr['width'],
                attr['height'],
                px, py);
            break;

        case VIA_REGION_SHAPE.CIRCLE:
            result = is_inside_circle(attr['cx'],
                attr['cy'],
                attr['r'],
                px, py);
            break;

        case VIA_REGION_SHAPE.ELLIPSE:
            result = is_inside_ellipse(attr['cx'],
                attr['cy'],
                attr['rx'],
                attr['ry'],
                attr['theta'],
                px, py);
            break;

        case VIA_REGION_SHAPE.POLYLINE: // handled by POLYGON
        case VIA_REGION_SHAPE.POLYGON:
            result = is_inside_polygon(attr['all_points_x'],
                attr['all_points_y'],
                px, py);
            break;

        case VIA_REGION_SHAPE.POINT:
            result = is_inside_point(attr['cx'],
                attr['cy'],
                px, py);
            break;
    }
    return result;
}

function is_inside_circle(cx, cy, r, px, py) {
    var dx = px - cx;
    var dy = py - cy;
    return (dx * dx + dy * dy) < r * r;
}

function is_inside_rect(x, y, w, h, px, py) {
    return px > x &&
        px < (x + w) &&
        py > y &&
        py < (y + h);
}

function is_inside_ellipse(cx, cy, rx, ry, rr, px, py) {
    // Inverse rotation of pixel coordinates
    var dx = Math.cos(-rr) * (cx - px) - Math.sin(-rr) * (cy - py)
    var dy = Math.sin(-rr) * (cx - px) + Math.cos(-rr) * (cy - py)

    return ((dx * dx) / (rx * rx)) + ((dy * dy) / (ry * ry)) < 1;
}

// returns 0 when (px,py) is outside the polygon
// source: http://geomalgorithms.com/a03-_inclusion.html
function is_inside_polygon(all_points_x, all_points_y, px, py) {
    if (all_points_x.length === 0 || all_points_y.length === 0) {
        return 0;
    }

    var wn = 0; // the  winding number counter
    var n = all_points_x.length;
    var i;
    // loop through all edges of the polygon
    for (i = 0; i < n - 1; ++i) { // edge from V[i] to  V[i+1]
        var is_left_value = is_left(all_points_x[i], all_points_y[i],
            all_points_x[i + 1], all_points_y[i + 1],
            px, py);

        if (all_points_y[i] <= py) {
            if (all_points_y[i + 1] > py && is_left_value > 0) {
                ++wn;
            }
        } else {
            if (all_points_y[i + 1] <= py && is_left_value < 0) {
                --wn;
            }
        }
    }

    // also take into account the loop closing edge that connects last point with first point
    var is_left_value = is_left(all_points_x[n - 1], all_points_y[n - 1],
        all_points_x[0], all_points_y[0],
        px, py);

    if (all_points_y[n - 1] <= py) {
        if (all_points_y[0] > py && is_left_value > 0) {
            ++wn;
        }
    } else {
        if (all_points_y[0] <= py && is_left_value < 0) {
            --wn;
        }
    }

    if (wn === 0) {
        return 0;
    } else {
        return 1;
    }
}

function is_inside_point(cx, cy, px, py) {
    var dx = px - cx;
    var dy = py - cy;
    var r2 = VIA_POLYGON_VERTEX_MATCH_TOL * VIA_POLYGON_VERTEX_MATCH_TOL;
    return (dx * dx + dy * dy) < r2;
}

// returns
// >0 if (x2,y2) lies on the left side of line joining (x0,y0) and (x1,y1)
// =0 if (x2,y2) lies on the line joining (x0,y0) and (x1,y1)
// >0 if (x2,y2) lies on the right side of line joining (x0,y0) and (x1,y1)
// source: http://geomalgorithms.com/a03-_inclusion.html
function is_left(x0, y0, x1, y1, x2, y2) {
    return (((x1 - x0) * (y2 - y0)) - ((x2 - x0) * (y1 - y0)));
}

function is_on_region_corner(px, py) {
    var _via_region_edge = [-1, -1]; // region_id, corner_id [top-left=1,top-right=2,bottom-right=3,bottom-left=4]

    for (var i = 0; i < _via_canvas_regions.length; ++i) {
        var attr = _via_canvas_regions[i].shape_attributes;
        var result = false;
        _via_region_edge[0] = i;

        switch (attr['name']) {
            case VIA_REGION_SHAPE.RECT:
                result = is_on_rect_edge(attr['x'],
                    attr['y'],
                    attr['width'],
                    attr['height'],
                    px, py);
                break;

            case VIA_REGION_SHAPE.CIRCLE:
                result = is_on_circle_edge(attr['cx'],
                    attr['cy'],
                    attr['r'],
                    px, py);
                break;

            case VIA_REGION_SHAPE.ELLIPSE:
                result = is_on_ellipse_edge(attr['cx'],
                    attr['cy'],
                    attr['rx'],
                    attr['ry'],
                    attr['theta'],
                    px, py);
                break;

            case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
            case VIA_REGION_SHAPE.POLYGON:
                result = is_on_polygon_vertex(attr['all_points_x'],
                    attr['all_points_y'],
                    px, py);
                if (result === 0) {
                    result = is_on_polygon_edge(attr['all_points_x'],
                        attr['all_points_y'],
                        px, py);
                }
                break;

            case VIA_REGION_SHAPE.POINT:
                // since there are no edges of a point
                result = 0;
                break;
        }

        if (result > 0) {
            _via_region_edge[1] = result;
            return _via_region_edge;
        }
    }
    _via_region_edge[0] = -1;
    return _via_region_edge;
}

function is_on_rect_edge(x, y, w, h, px, py) {
    var dx0 = Math.abs(x - px);
    var dy0 = Math.abs(y - py);
    var dx1 = Math.abs(x + w - px);
    var dy1 = Math.abs(y + h - py);
    //[top-left=1,top-right=2,bottom-right=3,bottom-left=4]
    if (dx0 < VIA_REGION_EDGE_TOL &&
        dy0 < VIA_REGION_EDGE_TOL) {
        return 1;
    }
    if (dx1 < VIA_REGION_EDGE_TOL &&
        dy0 < VIA_REGION_EDGE_TOL) {
        return 2;
    }
    if (dx1 < VIA_REGION_EDGE_TOL &&
        dy1 < VIA_REGION_EDGE_TOL) {
        return 3;
    }

    if (dx0 < VIA_REGION_EDGE_TOL &&
        dy1 < VIA_REGION_EDGE_TOL) {
        return 4;
    }

    var mx0 = Math.abs(x + w / 2 - px);
    var my0 = Math.abs(y + h / 2 - py);
    //[top-middle=5,right-middle=6,bottom-middle=7,left-middle=8]
    if (mx0 < VIA_REGION_EDGE_TOL &&
        dy0 < VIA_REGION_EDGE_TOL) {
        return 5;
    }
    if (dx1 < VIA_REGION_EDGE_TOL &&
        my0 < VIA_REGION_EDGE_TOL) {
        return 6;
    }
    if (mx0 < VIA_REGION_EDGE_TOL &&
        dy1 < VIA_REGION_EDGE_TOL) {
        return 7;
    }
    if (dx0 < VIA_REGION_EDGE_TOL &&
        my0 < VIA_REGION_EDGE_TOL) {
        return 8;
    }

    return 0;
}

function is_on_circle_edge(cx, cy, r, px, py) {
    var dx = cx - px;
    var dy = cy - py;
    if (Math.abs(Math.sqrt(dx * dx + dy * dy) - r) < VIA_REGION_EDGE_TOL) {
        var theta = Math.atan2(py - cy, px - cx);
        if (Math.abs(theta - (Math.PI / 2)) < VIA_THETA_TOL ||
            Math.abs(theta + (Math.PI / 2)) < VIA_THETA_TOL) {
            return 5;
        }
        if (Math.abs(theta) < VIA_THETA_TOL ||
            Math.abs(Math.abs(theta) - Math.PI) < VIA_THETA_TOL) {
            return 6;
        }

        if (theta > 0 && theta < (Math.PI / 2)) {
            return 1;
        }
        if (theta > (Math.PI / 2) && theta < (Math.PI)) {
            return 4;
        }
        if (theta < 0 && theta > -(Math.PI / 2)) {
            return 2;
        }
        if (theta < -(Math.PI / 2) && theta > -Math.PI) {
            return 3;
        }
    } else {
        return 0;
    }
}

function is_on_ellipse_edge(cx, cy, rx, ry, rr, px, py) {
    // Inverse rotation of pixel coordinates
    px = px - cx;
    py = py - cy;
    var px_ = Math.cos(-rr) * px - Math.sin(-rr) * py;
    var py_ = Math.sin(-rr) * px + Math.cos(-rr) * py;
    px = px_ + cx;
    py = py_ + cy;

    var dx = (cx - px) / rx;
    var dy = (cy - py) / ry;

    if (Math.abs(Math.sqrt(dx * dx + dy * dy) - 1) < VIA_ELLIPSE_EDGE_TOL) {
        var theta = Math.atan2(py - cy, px - cx);
        if (Math.abs(theta - (Math.PI / 2)) < VIA_THETA_TOL ||
            Math.abs(theta + (Math.PI / 2)) < VIA_THETA_TOL) {
            return 5;
        }
        if (Math.abs(theta) < VIA_THETA_TOL ||
            Math.abs(Math.abs(theta) - Math.PI) < VIA_THETA_TOL) {
            return 6;
        }
    } else {
        return 0;
    }
}

function is_on_polygon_vertex(all_points_x, all_points_y, px, py) {
    var i, n;
    n = all_points_x.length;

    for (i = 0; i < n; ++i) {
        if (Math.abs(all_points_x[i] - px) < VIA_POLYGON_VERTEX_MATCH_TOL &&
            Math.abs(all_points_y[i] - py) < VIA_POLYGON_VERTEX_MATCH_TOL) {
            return (VIA_POLYGON_RESIZE_VERTEX_OFFSET + i);
        }
    }
    return 0;
}

function is_on_polygon_edge(all_points_x, all_points_y, px, py) {
    var i, n, di, d;
    n = all_points_x.length;
    d = [];
    for (i = 0; i < n - 1; ++i) {
        di = dist_to_line(px, py, all_points_x[i], all_points_y[i], all_points_x[i + 1], all_points_y[i + 1]);
        d.push(di);
    }
    // closing edge
    di = dist_to_line(px, py, all_points_x[n - 1], all_points_y[n - 1], all_points_x[0], all_points_y[0]);
    d.push(di);

    var smallest_value = d[0];
    var smallest_index = 0;
    n = d.length;
    for (i = 1; i < n; ++i) {
        if (d[i] < smallest_value) {
            smallest_value = d[i];
            smallest_index = i;
        }
    }
    if (smallest_value < VIA_POLYGON_VERTEX_MATCH_TOL) {
        return (VIA_POLYGON_RESIZE_VERTEX_OFFSET + smallest_index);
    } else {
        return 0;
    }
}

function is_point_inside_bounding_box(x, y, x1, y1, x2, y2) {
    // ensure that (x1,y1) is top left and (x2,y2) is bottom right corner of rectangle
    var rect = {};
    if (x1 < x2) {
        rect.x1 = x1;
        rect.x2 = x2;
    } else {
        rect.x1 = x2;
        rect.x2 = x1;
    }
    if (y1 < y2) {
        rect.y1 = y1;
        rect.y2 = y2;
    } else {
        rect.y1 = y2;
        rect.y2 = y1;
    }

    if (x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2) {
        return true;
    } else {
        return false;
    }
}

function dist_to_line(x, y, x1, y1, x2, y2) {
    if (is_point_inside_bounding_box(x, y, x1, y1, x2, y2)) {
        var dy = y2 - y1;
        var dx = x2 - x1;
        var nr = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1);
        var dr = Math.sqrt(dx * dx + dy * dy);
        var dist = nr / dr;
        return Math.round(dist);
    } else {
        return Number.MAX_SAFE_INTEGER;
    }
}

function rect_standardize_coordinates(d) {
    // d[x0,y0,x1,y1]
    // ensures that (d[0],d[1]) is top-left corner while
    // (d[2],d[3]) is bottom-right corner
    if (d[0] > d[2]) {
        // swap
        var t = d[0];
        d[0] = d[2];
        d[2] = t;
    }

    if (d[1] > d[3]) {
        // swap
        var t = d[1];
        d[1] = d[3];
        d[3] = t;
    }
}

function rect_update_corner(corner_id, d, x, y, preserve_aspect_ratio) {
    // pre-condition : d[x0,y0,x1,y1] is standardized
    // post-condition : corner is moved ( d may not stay standardized )
    if (preserve_aspect_ratio) {
        switch (corner_id) {
            case 1: // Fall-through // top-left
            case 3: // bottom-right
                var dx = d[2] - d[0];
                var dy = d[3] - d[1];
                var norm = Math.sqrt(dx * dx + dy * dy);
                var nx = dx / norm; // x component of unit vector along the diagonal of rect
                var ny = dy / norm; // y component
                var proj = (x - d[0]) * nx + (y - d[1]) * ny;
                var proj_x = nx * proj;
                var proj_y = ny * proj;
                // constrain (mx,my) to lie on a line connecting (x0,y0) and (x1,y1)
                x = Math.round(d[0] + proj_x);
                y = Math.round(d[1] + proj_y);
                break;

            case 2: // Fall-through // top-right
            case 4: // bottom-left
                var dx = d[2] - d[0];
                var dy = d[1] - d[3];
                var norm = Math.sqrt(dx * dx + dy * dy);
                var nx = dx / norm; // x component of unit vector along the diagonal of rect
                var ny = dy / norm; // y component
                var proj = (x - d[0]) * nx + (y - d[3]) * ny;
                var proj_x = nx * proj;
                var proj_y = ny * proj;
                // constrain (mx,my) to lie on a line connecting (x0,y0) and (x1,y1)
                x = Math.round(d[0] + proj_x);
                y = Math.round(d[3] + proj_y);
                break;
        }
    }

    switch (corner_id) {
        case 1: // top-left
            d[0] = x;
            d[1] = y;
            break;

        case 3: // bottom-right
            d[2] = x;
            d[3] = y;
            break;

        case 2: // top-right
            d[2] = x;
            d[1] = y;
            break;

        case 4: // bottom-left
            d[0] = x;
            d[3] = y;
            break;

        case 5: // top-middle
            d[1] = y;
            break;

        case 6: // right-middle
            d[2] = x;
            break;

        case 7: // bottom-middle
            d[3] = y;
            break;

        case 8: // left-middle
            d[0] = x;
            break;
    }
}

function _via_update_ui_components() {

    show_message('Updating user interface components.');
    switch (_via_display_area_content_name) {
        case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID:
            image_grid_set_content_panel_height_fixed();
            image_grid_set_content_to_current_group();
            break;
        case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE:
            if (!_via_is_window_resized && _via_current_image_loaded) {
                _via_is_window_resized = true;
                _via_show_img(_via_image_index);

                if (_via_is_canvas_zoomed) {
                    reset_zoom_level();
                }
            }
            break;
    }
}

//
// Shortcut key handlers
//
function _via_window_keydown_handler(e) {
    if (e.target === document.body) {
        // process the keyboard event
        _via_handle_global_keydown_event(e);
    }
}

// global keys are active irrespective of element focus
// arrow keys, n, p, s, o, space, d, Home, End, PageUp, PageDown
function _via_handle_global_keydown_event(e) {
    // zoom
    if (_via_current_image_loaded) {
        if (e.key === "+") {
            //zoom_in();
            return;
        }

        if (e.key === "=") {
            reset_zoom_level();
            return;
        }

        if (e.key === "-") {
            //zoom_out();
            return;
        }
    }


    if (e.key === 'Escape') {
        e.preventDefault();
        if (_via_is_loading_current_image) {
            _via_cancel_current_image_loading();
        }

        if (_via_is_user_resizing_region) {
            // cancel region resizing action
            _via_is_user_resizing_region = false;
        }

        if (_via_is_region_selected) {
            // clear all region selections
            _via_is_region_selected = false;
            _via_user_sel_region_id = -1;
            toggle_all_regions_selection(false);
        }

        if (_via_is_user_drawing_polygon) {
            _via_is_user_drawing_polygon = false;
            _via_canvas_regions.splice(_via_current_polygon_region_id, 1);
        }

        if (_via_is_user_drawing_region) {
            _via_is_user_drawing_region = false;
        }

        if (_via_is_user_resizing_region) {
            _via_is_user_resizing_region = false
        }

        if (_via_is_user_moving_region) {
            _via_is_user_moving_region = false
        }

        _via_redraw_reg_canvas();
        return;
    }
}

function _via_reg_canvas_keyup_handler(e) {
    if (e.key === 'Control') {
        _via_is_ctrl_pressed = false;
    }
}

function _via_reg_canvas_keydown_handler(e) {
    if (e.key === 'Control') {
        _via_is_ctrl_pressed = true;
    }

    if (_via_current_image_loaded) {
        if (e.key === 'Enter') {
            if (_via_current_shape === VIA_REGION_SHAPE.POLYLINE ||
                _via_current_shape === VIA_REGION_SHAPE.POLYGON) {
                _via_polyshape_finish_drawing();
            }
        }
        if (e.key === 'Backspace') {
            if (_via_current_shape === VIA_REGION_SHAPE.POLYLINE ||
                _via_current_shape === VIA_REGION_SHAPE.POLYGON) {
                _via_polyshape_delete_last_vertex();
            }
        }

        if (e.key === 'a') {
            sel_all_regions();
            e.preventDefault();
            return;
        }

        if (e.key === 'c') {
            if (_via_is_region_selected ||
                _via_is_all_region_selected) {
                copy_sel_regions();
            }
            e.preventDefault();
            return;
        }

        if (e.key === 'v') {
            paste_sel_regions_in_current_image();
            e.preventDefault();
            return;
        }

        if (e.key === 'b') {
            toggle_region_boundary_visibility();
            e.preventDefault();
            return;
        }

        if (e.key === 'l') {
            toggle_region_id_visibility();
            e.preventDefault();
            return;
        }

        if (e.key === 'd') {
            if (_via_is_region_selected ||
                _via_is_all_region_selected) {
                del_sel_regions();
            }
            e.preventDefault();
            return;
        }

        if (_via_is_region_selected) {
            if (e.key === 'ArrowRight' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowDown' ||
                e.key === 'ArrowUp') {
                var del = 1;
                if (e.shiftKey) {
                    del = 10;
                }
                var move_x = 0;
                var move_y = 0;
                switch (e.key) {
                    case 'ArrowLeft':
                        move_x = -del;
                        break;
                    case 'ArrowUp':
                        move_y = -del;
                        break;
                    case 'ArrowRight':
                        move_x = del;
                        break;
                    case 'ArrowDown':
                        move_y = del;
                        break;
                }
                _via_move_selected_regions(move_x, move_y);
                _via_redraw_reg_canvas();
                e.preventDefault();
                return;
            }
        }
    }
    _via_handle_global_keydown_event(e);
}

function _via_polyshape_finish_drawing() {
    if (_via_is_user_drawing_polygon) {
        // double click is used to indicate completion of
        // polygon or polyline drawing action
        var new_region_id = _via_current_polygon_region_id;
        var new_region_shape = _via_current_shape;

        var npts = _via_canvas_regions[new_region_id].shape_attributes['all_points_x'].length;
        if (npts <= 2 && new_region_shape === VIA_REGION_SHAPE.POLYGON) {
            show_message('For a polygon, you must define at least 3 points. ' +
                'Press [Esc] to cancel drawing operation.!');
            return;
        }
        if (npts <= 1 && new_region_shape === VIA_REGION_SHAPE.POLYLINE) {
            show_message('A polyline must have at least 2 points. ' +
                'Press [Esc] to cancel drawing operation.!');
            return;
        }

        var img_id = _via_image_id;
        _via_current_polygon_region_id = -1;
        _via_is_user_drawing_polygon = false;
        _via_is_user_drawing_region = false;

        _ra_regions[new_region_id] = {}; // create placeholder
        _via_polyshape_add_new_polyshape(img_id, new_region_shape, new_region_id);
        select_only_region(new_region_id); // select new region
        //set_region_annotations_to_default_value( new_region_id );
        //annotation_editor_add_row( new_region_id );
        //annotation_editor_scroll_to_row( new_region_id );

        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
    }
    return;
}

function _via_polyshape_delete_last_vertex() {
    if (_via_is_user_drawing_polygon) {
        var npts = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'].length;
        if (npts > 0) {
            _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'].splice(npts - 1, 1);
            _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_y'].splice(npts - 1, 1);

            _via_redraw_reg_canvas();
            _via_reg_canvas.focus();
        }
    }
}

function _via_polyshape_add_new_polyshape(img_id, region_shape, region_id) {
    // add all polygon points stored in _via_canvas_regions[]
    var all_points_x = _via_canvas_regions[region_id].shape_attributes['all_points_x'].slice(0);
    var all_points_y = _via_canvas_regions[region_id].shape_attributes['all_points_y'].slice(0);

    var canvas_all_points_x = [];
    var canvas_all_points_y = [];
    var n = all_points_x.length;
    var i;
    for (i = 0; i < n; ++i) {
        all_points_x[i] = Math.round(all_points_x[i] * _via_canvas_scale);
        all_points_y[i] = Math.round(all_points_y[i] * _via_canvas_scale);

        canvas_all_points_x[i] = Math.round(all_points_x[i] / _via_canvas_scale);
        canvas_all_points_y[i] = Math.round(all_points_y[i] / _via_canvas_scale);
    }

    var polygon_region = new file_region();
    polygon_region.shape_attributes['name'] = region_shape;
    polygon_region.shape_attributes['all_points_x'] = all_points_x;
    polygon_region.shape_attributes['all_points_y'] = all_points_y;
    _ra_regions[region_id] = polygon_region;

    // update canvas
    if (img_id === _via_image_id) {
        _via_canvas_regions[region_id].shape_attributes['name'] = region_shape;
        _via_canvas_regions[region_id].shape_attributes['all_points_x'] = canvas_all_points_x;
        _via_canvas_regions[region_id].shape_attributes['all_points_y'] = canvas_all_points_y;
    }
}

function del_sel_regions() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        return;
    }

    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    var del_region_count = 0;
    if (_via_is_all_region_selected) {
        del_region_count = _via_canvas_regions.length;
        _via_canvas_regions.splice(0);
        _ra_regions.splice(0);
    } else {
        var sorted_sel_reg_id = [];
        for (var i = 0; i < _via_canvas_regions.length; ++i) {
            if (_via_region_selected_flag[i]) {
                sorted_sel_reg_id.push(i);
                _via_region_selected_flag[i] = false;
            }
        }
        sorted_sel_reg_id.sort(function (a, b) {
            return (b - a);
        });
        for (var i = 0; i < sorted_sel_reg_id.length; ++i) {
            _via_canvas_regions.splice(sorted_sel_reg_id[i], 1);
            _ra_regions.splice(sorted_sel_reg_id[i], 1);
            del_region_count += 1;
        }

        if (sorted_sel_reg_id.length) {
            _via_reg_canvas.style.cursor = "default";
        }
    }

    _via_is_all_region_selected = false;
    _via_is_region_selected = false;
    _via_user_sel_region_id = -1;

    if (_via_canvas_regions.length === 0) {
        // all regions were deleted, hence clear region canvas
        _via_clear_reg_canvas();
    } else {
        _via_redraw_reg_canvas();
    }
    _via_reg_canvas.focus();
    //annotation_editor_show();

    show_message('Deleted ' + del_region_count + ' selected regions');
}

function sel_all_regions() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        image_grid_group_toggle_select_all();
        return;
    }

    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    toggle_all_regions_selection(true);
    _via_is_all_region_selected = true;
    _via_redraw_reg_canvas();
}

function copy_sel_regions() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        return;
    }

    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_is_region_selected ||
        _via_is_all_region_selected) {
        _via_copied_image_regions.splice(0);
        for (var i = 0; i < _ra_regions.length; ++i) {
            var img_region = _ra_regions[i];
            var canvas_region = _via_canvas_regions[i];
            if (_via_region_selected_flag[i]) {
                _via_copied_image_regions.push(clone_image_region(img_region));
            }
        }
        show_message('Copied ' + _via_copied_image_regions.length +
            ' selected regions. Press Ctrl + v to paste');
    } else {
        show_message('Select a region first!');
    }
}

function paste_sel_regions_in_current_image() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        return;
    }

    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_copied_image_regions.length) {
        var pasted_reg_count = 0;
        for (var i = 0; i < _via_copied_image_regions.length; ++i) {
            // ensure copied the regions are within this image's boundaries
            var bbox = get_region_bounding_box(_via_copied_image_regions[i]);
            if (bbox[2] < _via_current_image_width &&
                bbox[3] < _via_current_image_height) {
                var r = clone_image_region(_via_copied_image_regions[i]);
                _ra_regions.push(r);

                pasted_reg_count += 1;
            }
        }
        _via_load_canvas_regions();
        var discarded_reg_count = _via_copied_image_regions.length - pasted_reg_count;
        show_message('Pasted ' + pasted_reg_count + ' regions. ' +
            'Discarded ' + discarded_reg_count + ' regions exceeding image boundary.');
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
    } else {
        show_message('To paste a region, you first need to select a region and copy it!');
    }
}

function paste_to_multiple_images_with_confirm() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        return;
    }

    if (_via_copied_image_regions.length === 0) {
        show_message('First copy some regions!');
        return;
    }

    var config = {
        'title': 'Paste Regions to Multiple Images'
    };
    var input = {
        'region_count': {
            type: 'text',
            name: 'Number of copied regions',
            value: _via_copied_image_regions.length,
            disabled: true
        },
        'prev_next_count': {
            type: 'text',
            name: 'Copy to (count format)<br><span style="font-size:0.8rem">For example: to paste copied regions to the <i>previous 2 images</i> and <i>next 3 images</i>, type <strong>2,3</strong> in the textbox and to paste only in <i>next 5 images</i>, type <strong>0,5</strong></span>',
            placeholder: '2,3',
            disabled: false,
            size: 30
        },
        'img_index_list': {
            type: 'text',
            name: 'Copy to (image index list)<br><span style="font-size:0.8rem">For example: <strong>2-5,7,9</strong> pastes the copied regions to the images with the following id <i>2,3,4,5,7,9</i> and <strong>3,8,141</strong> pastes to the images with id <i>3,8 and 141</i></span>',
            placeholder: '2-5,7,9',
            disabled: false,
            size: 30
        },
        'regex': {
            type: 'text',
            name: 'Copy to filenames matching a regular expression<br><span style="font-size:0.8rem">For example: <strong>_large</strong> pastes the copied regions to all images whose filename contain the keyword <i>_large</i></span>',
            placeholder: 'regular expression',
            disabled: false,
            size: 30
        },
        'include_region_attributes': {
            type: 'checkbox',
            name: 'Paste also the region annotations',
            checked: true
        },
    };

    invoke_with_user_inputs(paste_to_multiple_images_confirmed, input, config);
}

function paste_to_multiple_images_confirmed(input) {
    // keep a copy of user inputs for the undo operation
    _via_paste_to_multiple_images_input = input;
    var intersect = generate_img_index_list(input);
    var i;
    var total_pasted_region_count = 0;
    for (i = 0; i < intersect.length; i++) {
        total_pasted_region_count += paste_regions(intersect[i]);
    }

    show_message('Pasted [' + total_pasted_region_count + '] regions ' +
        'in ' + intersect.length + ' images');

    if (intersect.includes(_via_image_index)) {
        _via_load_canvas_regions();
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
    }
    user_input_default_cancel_handler();
}

function paste_regions(img_index) {
    var pasted_reg_count = 0;
    if (_via_copied_image_regions.length) {
        var img_id = _via_image_id_list[img_index];
        var i;
        for (i = 0; i < _via_copied_image_regions.length; ++i) {
            var r = clone_image_region(_via_copied_image_regions[i]);
            _ra_regions.push(r);

            pasted_reg_count += 1;
        }
    }
    return pasted_reg_count;
}


function del_sel_regions_with_confirm() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        return;
    }

    if (_via_copied_image_regions.length === 0) {
        show_message('First copy some regions!');
        return;
    }

    var prev_next_count, img_index_list, regex;
    if (_via_paste_to_multiple_images_input) {
        prev_next_count = _via_paste_to_multiple_images_input.prev_next_count.value;
        img_index_list = _via_paste_to_multiple_images_input.img_index_list.value;
        regex = _via_paste_to_multiple_images_input.regex.value;
    }

    var config = {
        'title': 'Undo Regions Pasted to Multiple Images'
    };
    var input = {
        'region_count': {
            type: 'text',
            name: 'Number of regions selected',
            value: _via_copied_image_regions.length,
            disabled: true
        },
        'prev_next_count': {
            type: 'text',
            name: 'Delete from (count format)<br><span style="font-size:0.8rem">For example: to delete copied regions from the <i>previous 2 images</i> and <i>next 3 images</i>, type <strong>2,3</strong> in the textbox and to delete regions only in <i>next 5 images</i>, type <strong>0,5</strong></span>',
            placeholder: '2,3',
            disabled: false,
            size: 30,
            value: prev_next_count
        },
        'img_index_list': {
            type: 'text',
            name: 'Delete from (image index list)<br><span style="font-size:0.8rem">For example: <strong>2-5,7,9</strong> deletes the copied regions to the images with the following id <i>2,3,4,5,7,9</i> and <strong>3,8,141</strong> deletes regions from the images with id <i>3,8 and 141</i></span>',
            placeholder: '2-5,7,9',
            disabled: false,
            size: 30,
            value: img_index_list
        },
        'regex': {
            type: 'text',
            name: 'Delete from filenames matching a regular expression<br><span style="font-size:0.8rem">For example: <strong>_large</strong> deletes the copied regions from all images whose filename contain the keyword <i>_large</i></span>',
            placeholder: 'regular expression',
            disabled: false,
            size: 30,
            value: regex
        },
    };

    invoke_with_user_inputs(del_sel_regions_confirmed, input, config);
}

function del_sel_regions_confirmed(input) {
    user_input_default_cancel_handler();
    var intersect = generate_img_index_list(input);
    var i;
    var total_deleted_region_count = 0;
    for (i = 0; i < intersect.length; i++) {
        total_deleted_region_count += delete_regions(intersect[i]);
    }

    show_message('Deleted [' + total_deleted_region_count + '] regions ' +
        'in ' + intersect.length + ' images');

    if (intersect.includes(_via_image_index)) {
        _via_load_canvas_regions();
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
    }
}

function delete_regions(img_index) {
    var del_region_count = 0;
    if (_via_copied_image_regions.length) {
        var img_id = _via_image_id_list[img_index];
        var i;
        for (i = 0; i < _via_copied_image_regions.length; ++i) {
            var copied_region_shape_str = JSON.stringify(_via_copied_image_regions[i].shape_attributes);
            var j;
            // start from last region in order to delete the last pasted region
            for (j = _ra_regions.length - 1; j >= 0; --j) {
                if (JSON.stringify(_ra_regions[j].shape_attributes) === copied_region_shape_str) {
                    _ra_regions.splice(j, 1);
                    del_region_count += 1;
                    break; // delete only one matching region
                }
            }
        }
    }
    return del_region_count;
}

function show_first_image() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        if (_via_image_grid_group_var.length) {
            image_grid_group_prev({
                'value': 0
            }); // simulate button click
        } else {
            show_message('First, create groups by selecting items from "Group by" dropdown list');
        }
        return;
    }

    if (_via_img_count > 0) {
        _via_show_img(_via_img_fn_list_img_index_list[0]);
    }
}

function show_last_image() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        if (_via_image_grid_group_var.length) {
            image_grid_group_prev({
                'value': _via_image_grid_group_var.length - 1
            }); // simulate button click
        } else {
            show_message('First, create groups by selecting items from "Group by" dropdown list');
        }
        return;
    }

    if (_via_img_count > 0) {
        var last_img_index = _via_img_fn_list_img_index_list.length - 1;
        _via_show_img(_via_img_fn_list_img_index_list[last_img_index]);
    }
}

function jump_image_block_get_count() {
    var n = _via_img_fn_list_img_index_list.length;
    if (n < 20) {
        return 2;
    }
    if (n < 100) {
        return 10;
    }
    if (n < 1000) {
        return 25;
    }
    if (n < 5000) {
        return 50;
    }
    if (n < 10000) {
        return 100;
    }
    if (n < 50000) {
        return 500;
    }

    return Math.round(n / 50);
}

function jump_to_next_image_block() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        return;
    }

    var jump_count = jump_image_block_get_count();
    if (jump_count > 1) {
        var current_img_index = _via_image_index;
        if (_via_img_fn_list_img_index_list.includes(current_img_index)) {
            var list_index = _via_img_fn_list_img_index_list.indexOf(current_img_index);
            var next_list_index = list_index + jump_count;
            if ((next_list_index + 1) > _via_img_fn_list_img_index_list.length) {
                next_list_index = 0;
            }
            var next_img_index = _via_img_fn_list_img_index_list[next_list_index];
            _via_show_img(next_img_index);
        }
    } else {
        move_to_next_image();
    }
}

function jump_to_prev_image_block() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        return;
    }

    var jump_count = jump_image_block_get_count();
    if (jump_count > 1) {
        var current_img_index = _via_image_index;
        if (_via_img_fn_list_img_index_list.includes(current_img_index)) {
            var list_index = _via_img_fn_list_img_index_list.indexOf(current_img_index);
            var prev_list_index = list_index - jump_count;
            if (prev_list_index < 0) {
                prev_list_index = _via_img_fn_list_img_index_list.length - 1;
            }
            var prev_img_index = _via_img_fn_list_img_index_list[prev_list_index];
            _via_show_img(prev_img_index);
        }
    } else {
        move_to_prev_image();
    }
}


function set_zoom(zoom_level_index) {
    if (zoom_level_index === VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX) {
        _via_is_canvas_zoomed = false;
        _via_canvas_zoom_level_index = VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX;
    } else {
        _via_is_canvas_zoomed = true;
        _via_canvas_zoom_level_index = zoom_level_index;
    }

    var zoom_scale = VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index];
    set_all_canvas_scale(zoom_scale);
    var canvas_w = (_via_current_image.naturalWidth * zoom_scale) / _via_canvas_scale_without_zoom;
    var canvas_h = (_via_current_image.naturalHeight * zoom_scale) / _via_canvas_scale_without_zoom;
    set_all_canvas_size(canvas_w, canvas_h);
    _via_canvas_scale = _via_canvas_scale_without_zoom / zoom_scale;
    _via_canvas_scale = _via_canvas_scale_without_zoom / zoom_scale;

    if (zoom_scale === 1) {
        VIA_REGION_POINT_RADIUS = VIA_REGION_POINT_RADIUS_DEFAULT;
    } else {
        if (zoom_scale > 1) {
            VIA_REGION_POINT_RADIUS = VIA_REGION_POINT_RADIUS_DEFAULT * zoom_scale;
        }
    }

    _via_load_canvas_regions(); // image to canvas space transform
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
    update_vertical_space();
}

function reset_zoom_level() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        image_grid_image_size_reset();
        show_message('Zoom reset');
        return;
    }

    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_is_canvas_zoomed) {
        set_zoom(VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX);
        show_message('Zoom reset');
    } else {
        show_message('Cannot reset zoom because image zoom has not been applied!');
    }
    update_vertical_space();
}

function zoom_in() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        image_grid_image_size_increase();
        show_message('Increased size of images shown in image grid');
        return;
    }

    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_is_user_drawing_polygon || _via_is_user_drawing_region) {
        return;
    }

    if (_via_canvas_zoom_level_index === (VIA_CANVAS_ZOOM_LEVELS.length - 1)) {
        show_message('Further zoom-in not possible');
    } else {
        var new_zoom_level_index = _via_canvas_zoom_level_index + 1;
        set_zoom(new_zoom_level_index);
        show_message('Zoomed in to level ' + VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index] + 'X');
    }
}

function zoom_out() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        image_grid_image_size_decrease();
        show_message('Reduced size of images shown in image grid');
        return;
    }

    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_is_user_drawing_polygon || _via_is_user_drawing_region) {
        return;
    }

    if (_via_canvas_zoom_level_index === 0) {
        show_message('Further zoom-out not possible');
    } else {
        var new_zoom_level_index = _via_canvas_zoom_level_index - 1;
        set_zoom(new_zoom_level_index);
        show_message('Zoomed out to level ' + VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index] + 'X');
    }
}

function toggle_region_boundary_visibility() {
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE) {
        _via_is_region_boundary_visible = !_via_is_region_boundary_visible;
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
    }

    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        if (_via_settings.ui.image_grid.show_region_shape) {
            _via_settings.ui.image_grid.show_region_shape = false;
            document.getElementById('image_grid_content_rshape').innerHTML = '';
        } else {
            _via_settings.ui.image_grid.show_region_shape = true;
            image_grid_page_show_all_regions();
        }
    }
}

function toggle_region_id_visibility() {
    _via_is_region_id_visible = !_via_is_region_id_visible;
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
}

function toggle_region_info_visibility() {
    var elem = document.getElementById('region_info');
    // toggle between displaying and not displaying
    if (elem.classList.contains('display_none')) {
        elem.classList.remove('display_none');
        _via_is_region_info_visible = true;
    } else {
        elem.classList.add('display_none');
        _via_is_region_info_visible = false;
    }
}

//
// Mouse wheel event listener
//
function _via_reg_canvas_mouse_wheel_listener(e) {
    if (!_via_current_image_loaded) {
        return;
    }

    if (e.ctrlKey) {
        // perform zoom
        if (e.deltaY < 0) {
            zoom_in();
        } else {
            zoom_out();
        }
        e.preventDefault();
    }
}

function region_visualisation_update(type, default_id, next_offset) {
    var attr_list = [default_id];
    attr_list = attr_list.concat(Object.keys(_via_attributes['region']));
    var n = attr_list.length;
    var current_index = attr_list.indexOf(_via_settings.ui.image[type]);
    var new_index;
    if (current_index !== -1) {
        new_index = current_index + next_offset;

        if (new_index < 0) {
            new_index = n + new_index;
        }
        if (new_index >= n) {
            new_index = new_index - n;
        }
        switch (type) {
            case 'region_label':
                _via_settings.ui.image.region_label = attr_list[new_index];
                _via_redraw_reg_canvas();
                break;
            case 'region_color':
                _via_settings.ui.image.region_color = attr_list[new_index];
                _via_regions_group_color_init();
                _via_redraw_reg_canvas();
        }

        var type_str = type.replace('_', ' ');
        if (_via_settings.ui.image[type].startsWith('__via')) {
            show_message(type_str + ' cleared');
        } else {
            show_message(type_str + ' set to region attribute [' + _via_settings.ui.image[type] + ']');
        }
    }
}


//
// image filename list shown in leftsidebar panel
//
function is_img_fn_list_visible() {
    return img_fn_list_panel.classList.contains('show');
}

function img_loading_spinbar(image_index, show) {

}

function update_img_fn_list() {

}

function img_fn_list_onregex() {
    var regex = document.getElementById('img_fn_list_regex').value;
    img_fn_list_generate_html(regex);
    img_fn_list.innerHTML = _via_img_fn_list_html.join('');
    img_fn_list_scroll_to_current_file();

    // select 'regex' in the predefined filter list
    var p = document.getElementById('filelist_preset_filters_list');
    if (regex === '') {
        p.selectedIndex = 0;
    } else {
        var i;
        for (i = 0; i < p.options.length; ++i) {
            if (p.options[i].value === 'regex') {
                p.selectedIndex = i;
                break;
            }
        }
    }
}

function img_fn_list_ith_entry_selected(img_index, is_selected) {
    if (is_selected) {
        img_fn_list_ith_entry_add_css_class(img_index, 'sel');
    } else {
        img_fn_list_ith_entry_remove_css_class(img_index, 'sel');
    }
}

function img_fn_list_ith_entry_error(img_index, is_error) {
    if (is_error) {
        img_fn_list_ith_entry_add_css_class(img_index, 'error');
    } else {
        img_fn_list_ith_entry_remove_css_class(img_index, 'error');
    }
}

function img_fn_list_ith_entry_add_css_class(img_index, classname) {
    var li = document.getElementById('fl' + img_index);
    if (li && !li.classList.contains(classname)) {
        li.classList.add(classname);
    }
}

function img_fn_list_ith_entry_remove_css_class(img_index, classname) {
    var li = document.getElementById('fl' + img_index);
    if (li && li.classList.contains(classname)) {
        li.classList.remove(classname);
    }
}

function img_fn_list_clear_all_style() {
    
}

function img_fn_list_clear_css_classname(classname) {
    var cn = document.getElementById('img_fn_list').childNodes[0].childNodes;
    var i;
    var n = cn.length;
    for (i = 0; i < n; ++i) {
        if (cn[i].classList.contains(classname)) {
            cn[i].classList.remove(classname);
        }
    }
}

function img_fn_list_ith_entry_html(i) {
    var htmli = '';
    var filename = _via_image_filename_list[i];
    if (is_url(filename)) {
        filename = filename.substr(0, 4) + '...' + get_filename_from_url(filename);
    }

    htmli += '<li id="fl' + i + '"';
    if (_via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID) {
        if (_via_image_grid_page_img_index_list.includes(i)) {
            // highlight images being shown in image grid
            htmli += ' class="sel"';
        }

    } else {
        if (i === _via_image_index) {
            // highlight the current entry
            htmli += ' class="sel"';
        }
    }
    htmli += ' onclick="jump_to_image(' + (i) + ')" title="' + _via_image_filename_list[i] + '">[' + (i + 1) + '] ' + decodeURIComponent(filename) + '</li>';
    return htmli;
}

function img_fn_list_generate_html(regex) {
    _via_img_fn_list_html = [];
    _via_img_fn_list_img_index_list = [];
    _via_img_fn_list_html.push('<ul>');
    for (var i = 0; i < _via_image_filename_list.length; ++i) {
        var filename = _via_image_filename_list[i];
        if (filename.match(regex) !== null) {
            _via_img_fn_list_html.push(img_fn_list_ith_entry_html(i));
            _via_img_fn_list_img_index_list.push(i);
        }
    }
    _via_img_fn_list_html.push('</ul>');
}

function img_fn_list_scroll_to_current_file() {
    img_fn_list_scroll_to_file(_via_image_index);
}

function img_fn_list_scroll_to_file(file_index) {
    if (_via_img_fn_list_img_index_list.includes(file_index)) {
        var sel_file = document.getElementById('fl' + file_index);
        var panel_height = img_fn_list.clientHeight - 20;
        var window_top = img_fn_list.scrollTop;
        var window_bottom = img_fn_list.scrollTop + panel_height
        if (sel_file.offsetTop > window_top) {
            if (sel_file.offsetTop > window_bottom) {
                img_fn_list.scrollTop = sel_file.offsetTop;
            }
        } else {
            img_fn_list.scrollTop = sel_file.offsetTop - panel_height;
        }
    }
}

function toggle_img_fn_list_visibility() {
    leftsidebar_show();
    document.getElementById('img_fn_list_panel').classList.toggle('show');
    document.getElementById('project_panel_title').classList.toggle('active');
}

function toggle_attributes_editor() {
    leftsidebar_show();
    //document.getElementById('attributes_editor_panel').classList.toggle('show');
    //document.getElementById('attributes_editor_panel_title').classList.toggle('active');
}

// this vertical spacer is needed to allow scrollbar to show
// items like Keyboard Shortcut hidden under the attributes panel
function update_vertical_space() {

}

//
// region and file attributes update panel
//

//
// via project
//
function project_set_name(name) {
    _via_settings.project.name = name;

}

function project_init_default_project() {
    if (!_via_settings.hasOwnProperty('project')) {
        _via_settings.project = {};
    }

    project_set_name(project_get_default_project_name());
}

function project_on_name_update(p) {
    project_set_name(p.value);
}

function project_get_default_project_name() {
    const now = new Date();
    var MONTH_SHORT_NAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var ts = now.getDate() + MONTH_SHORT_NAME[now.getMonth()] + now.getFullYear() +
        '_' + now.getHours() + 'h' + now.getMinutes() + 'm';

    var project_name = 'via_project_' + ts;
    return project_name;
}

function project_save_with_confirm() {
    var config = {
        'title': 'Save Project'
    };
    var input = {
        'project_name': {
            type: 'text',
            name: 'Project Name',
            value: _via_settings.project.name,
            disabled: false,
            size: 30
        },
        'save_annotations': {
            type: 'checkbox',
            name: 'Save region and file annotations (i.e. manual annotations)',
            checked: true,
            disabled: false
        },
        'save_attributes': {
            type: 'checkbox',
            name: 'Save region and file attributes.',
            checked: true
        },
        'save_via_settings': {
            type: 'checkbox',
            name: 'Save VIA application settings',
            checked: true
        },
        //                'save_base64_data':{ type:'checkbox', name:'Save base64 data of images (if present)', checked:false},
        //                'save_images':{type:'checkbox', 'name':'Save images <span class="warning">(WARNING: only recommended for projects containing small number of images)</span>', value:false},
    };

    invoke_with_user_inputs(project_save_confirmed, input, config);
}

function project_save_confirmed(input) {
    if (input.project_name.value !== _via_settings.project.name) {
        project_set_name(input.project_name.value);
    }

    // via project
    var _via_project = {
        '_via_settings': _via_settings,
        '_via_img_metadata': _via_img_metadata,
        '_via_attributes': _via_attributes,
        '_via_data_format_version': '2.0.10',
        '_via_image_id_list': _via_image_id_list
    };

    var filename = input.project_name.value + '.json';
    var data_blob = new Blob([JSON.stringify(_via_project)], {
        type: 'text/json;charset=utf-8'
    });

    save_data_to_local_file(data_blob, filename);

    user_input_default_cancel_handler();
}

function project_open_select_project_file() {
    if (invisible_file_input) {
        invisible_file_input.accept = '.json';
        invisible_file_input.onchange = project_open;
        invisible_file_input.removeAttribute('multiple');
        invisible_file_input.click();
    }
}

function project_open(event) {
    var selected_file = event.target.files[0];
    load_text_file(selected_file, project_open_parse_json_file);
}

function project_open_parse_json_file(project_file_data) {
    var d = JSON.parse(project_file_data);
    if (d['_via_settings'] && d['_via_img_metadata'] && d['_via_attributes']) {
        // import settings
        project_import_settings(d['_via_settings']);

        // clear existing data (if any)
        _via_image_id_list = [];
        _via_image_filename_list = [];
        _via_img_count = 0;
        _via_img_metadata = {};
        _via_img_fileref = {};
        _via_img_src = {};
        _via_attributes = {
            'region': {},
            'file': {}
        };
        _via_buffer_remove_all();

        // import image metadata
        _via_img_metadata = {};
        for (var img_id in d['_via_img_metadata']) {
            if ('filename' in d['_via_img_metadata'][img_id] &&
                'size' in d['_via_img_metadata'][img_id] &&
                'regions' in d['_via_img_metadata'][img_id] &&
                'file_attributes' in d['_via_img_metadata'][img_id]) {
                if (!d.hasOwnProperty('_via_image_id_list')) {
                    _via_image_id_list.push(img_id);
                    _via_image_filename_list.push(d['_via_img_metadata'][img_id].filename);
                }

                _via_img_metadata[img_id] = d['_via_img_metadata'][img_id];
                _via_img_count += 1;
            } else {
                console.log('discarding malformed entry for ' + img_id +
                    ': ' + JSON.stringify(d['_via_img_metadata'][img_id]));
            }
        }


        // import image_id_list which records the order of images
        if (d.hasOwnProperty('_via_image_id_list')) {
            _via_image_id_list = d['_via_image_id_list'];
            for (var img_id_index in d['_via_image_id_list']) {
                var img_id = d['_via_image_id_list'][img_id_index];
                _via_image_filename_list.push(_via_img_metadata[img_id]['filename']);
            }
        }

        // import attributes
        _via_attributes = d['_via_attributes'];
        project_parse_via_attributes_from_img_metadata();
        var fattr_id_list = Object.keys(_via_attributes['file']);
        var rattr_id_list = Object.keys(_via_attributes['region']);
        if (rattr_id_list.length) {
            _via_attribute_being_updated = 'region';
            _via_current_attribute_id = rattr_id_list[0];
        } else {
            if (fattr_id_list.length) {
                _via_attribute_being_updated = 'file';
                _via_current_attribute_id = fattr_id_list[0];
            }
        }

        if (_via_settings.core.default_filepath !== '') {
            _via_file_resolve_all_to_default_filepath();
        }

        show_message('Imported project [' + _via_settings['project'].name + '] with ' + _via_img_count + ' files.');

        if (_via_img_count > 0) {
            _via_show_img(0);
            update_img_fn_list();
            _via_reload_img_fn_list_table = true;
        }
    } else {
        show_message('Cannot import project from a corrupt file!');
    }
}

function project_parse_via_attributes_from_img_metadata() {
    // parse _via_img_metadata to populate _via_attributes
    var img_id, fa, ra;

    if (!_via_attributes.hasOwnProperty('file')) {
        _via_attributes['file'] = {};
    }
    if (!_via_attributes.hasOwnProperty('region')) {
        _via_attributes['region'] = {};
    }

    for (img_id in _via_img_metadata) {
        // file attributes
        for (fa in _via_img_metadata[img_id].file_attributes) {
            if (!_via_attributes['file'].hasOwnProperty(fa)) {
                _via_attributes['file'][fa] = {};
                _via_attributes['file'][fa]['type'] = 'text';
            }
        }
        // region attributes
        var ri;
        for (ri = 0; ri < _via_img_metadata[img_id].regions.length; ++ri) {
            for (ra in _via_img_metadata[img_id].regions[ri].region_attributes) {
                if (!_via_attributes['region'].hasOwnProperty(ra)) {
                    _via_attributes['region'][ra] = {};
                    _via_attributes['region'][ra]['type'] = 'text';
                }
            }
        }
    }
}

function project_import_settings(s) {
    // @todo find a generic way to import into _via_settings
    // only the components present in s (and not overwrite everything)
    var k1;
    for (k1 in s) {
        if (typeof (s[k1]) === 'object') {
            var k2;
            for (k2 in s[k1]) {
                if (typeof (s[k1][k2]) === 'object') {
                    var k3;
                    for (k3 in s[k1][k2]) {
                        _via_settings[k1][k2][k3] = s[k1][k2][k3];
                    }
                } else {
                    _via_settings[k1][k2] = s[k1][k2];
                }
            }
        } else {
            _via_settings[k1] = s[k1];
        }
    }
}

function project_file_remove_with_confirm() {
    var img_id = _via_image_id_list[_via_image_index];
    var filename = _via_img_metadata[img_id].filename;
    var region_count = _via_img_metadata[img_id].regions.length;

    var config = {
        'title': 'Remove File from Project'
    };
    var input = {
        'img_index': {
            type: 'text',
            name: 'File Id',
            value: (_via_image_index + 1),
            disabled: true,
            size: 8
        },
        'filename': {
            type: 'text',
            name: 'Filename',
            value: filename,
            disabled: true,
            size: 30
        },
        'region_count': {
            type: 'text',
            name: 'Number of regions',
            disabled: true,
            value: region_count,
            size: 8
        }
    };

    invoke_with_user_inputs(project_file_remove_confirmed, input, config);
}



//
// image grid
//

//
// hooks for sub-modules
// implemented by sub-modules
//
//function _via_hook_next_image() {}
//function _via_hook_prev_image() {}


////////////////////////////////////////////////////////////////////////////////
//
// Code borrowed from via2 branch
// - in future, the <canvas> based reigon shape drawing will be replaced by <svg>
//   because svg allows independent manipulation of individual regions without
//   requiring to clear the canvas every time some region is updated.
//
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//
// @file        _via_region.js
// @description Implementation of region shapes like rectangle, circle, etc.
// @author      Abhishek Dutta <adutta@robots.ox.ac.uk>
// @date        17 June 2017
//
////////////////////////////////////////////////////////////////////////////////

function _via_region(shape, id, data_img_space, view_scale_factor, view_offset_x, view_offset_y) {
    // Note the following terminology:
    //   view space  :
    //     - corresponds to the x-y plane on which the scaled version of original image is shown to the user
    //     - all the region query operations like is_inside(), is_on_edge(), etc are performed in view space
    //     - all svg draw operations like get_svg() are also in view space
    //
    //   image space :
    //     - corresponds to the x-y plane which corresponds to the spatial space of the original image
    //     - region save, export, git push operations are performed in image space
    //     - to avoid any rounding issues (caused by floating scale factor),
    //        * user drawn regions in view space is first converted to image space
    //        * this region in image space is now used to initialize region in view space
    //
    //   The two spaces are related by _via_model.now.tform.scale which is computed by the method
    //     _via_ctrl.compute_view_panel_to_nowfile_tform()
    //   and applied as follows:
    //     x coordinate in image space = scale_factor * x coordinate in view space
    //
    // shape : {rect, circle, ellipse, line, polyline, polygon, point}
    // id    : unique region-id
    // d[]   : (in view space) data whose meaning depend on region shape as follows:
    //        rect     : d[x1,y1,x2,y2] or d[corner1_x, corner1_y, corner2_x, corner2_y]
    //        circle   : d[x1,y1,x2,y2] or d[center_x, center_y, circumference_x, circumference_y]
    //        ellipse  : d[x1,y1,x2,y2,transform]
    //        line     : d[x1,y1,x2,y2]
    //        polyline : d[x1,y1,...,xn,yn]
    //        polygon  : d[x1,y1,...,xn,yn]
    //        point    : d[cx,cy]
    // scale_factor : for conversion from view space to image space
    //
    // Note: no svg data are stored with prefix "_". For example: _scale_factor, _x2
    this.shape = shape;
    this.id = id;
    this.scale_factor = view_scale_factor;
    this.offset_x = view_offset_x;
    this.offset_y = view_offset_y;
    this.recompute_svg = false;
    this.attributes = {};

    var n = data_img_space.length;
    var i;
    this.dview = new Array(n);
    this.dimg = new Array(n);

    if (n !== 0) {
        // IMPORTANT:
        // to avoid any rounding issues (caused by floating scale factor), we stick to
        // the principal that image space coordinates are the ground truth for every region.
        // Hence, we proceed as:
        //   * user drawn regions in view space is first converted to image space
        //   * this region in image space is now used to initialize region in view space
        for (i = 0; i < n; i++) {
            this.dimg[i] = data_img_space[i];

            var offset = this.offset_x;
            if (i % 2 !== 0) {
                // y coordinate
                offset = this.offset_y;
            }
            this.dview[i] = Math.round(this.dimg[i] * this.scale_factor) + offset;
        }
    }

    // set svg attributes for each shape
    switch (this.shape) {
        case "rect":
            _via_region_rect.call(this);
            this.svg_attributes = ['x', 'y', 'width', 'height'];
            break;
        case "circle":
            _via_region_circle.call(this);
            this.svg_attributes = ['cx', 'cy', 'r'];
            break;
        case "ellipse":
            _via_region_ellipse.call(this);
            this.svg_attributes = ['cx', 'cy', 'rx', 'ry', 'transform'];
            break;
        case "line":
            _via_region_line.call(this);
            this.svg_attributes = ['x1', 'y1', 'x2', 'y2'];
            break;
        case "polyline":
            _via_region_polyline.call(this);
            this.svg_attributes = ['points'];
            break;
        case "polygon":
            _via_region_polygon.call(this);
            this.svg_attributes = ['points'];
            break;
        case "point":
            _via_region_point.call(this);
            // point is a special circle with minimal radius required for visualization
            this.shape = 'circle';
            this.svg_attributes = ['cx', 'cy', 'r'];
            break;
    }

    this.initialize();
}


_via_region.prototype.prepare_svg_element = function () {
    var _VIA_SVG_NS = "http://www.w3.org/2000/svg";
    this.svg_element = document.createElementNS(_VIA_SVG_NS, this.shape);
    this.svg_string = '<' + this.shape;
    this.svg_element.setAttributeNS(null, 'id', this.id);

    var n = this.svg_attributes.length;
    for (var i = 0; i < n; i++) {
        this.svg_element.setAttributeNS(null, this.svg_attributes[i], this[this.svg_attributes[i]]);
        this.svg_string += ' ' + this.svg_attributes[i] + '="' + this[this.svg_attributes[i]] + '"';
    }
    this.svg_string += '/>';
}

_via_region.prototype.get_svg_element = function () {
    if (this.recompute_svg) {
        this.prepare_svg_element();
        this.recompute_svg = false;
    }
    return this.svg_element;
}

_via_region.prototype.get_svg_string = function () {
    if (this.recompute_svg) {
        this.prepare_svg_element();
        this.recompute_svg = false;
    }
    return this.svg_string;
}

///
/// Region shape : rectangle
///
function _via_region_rect() {
    this.is_inside = _via_region_rect.prototype.is_inside;
    this.is_on_edge = _via_region_rect.prototype.is_on_edge;
    this.move = _via_region_rect.prototype.move;
    this.resize = _via_region_rect.prototype.resize;
    this.initialize = _via_region_rect.prototype.initialize;
    this.dist_to_nearest_edge = _via_region_rect.prototype.dist_to_nearest_edge;
}

_via_region_rect.prototype.initialize = function () {
    // ensure that this.(x,y) corresponds to top-left corner of rectangle
    // Note: this.(x2,y2) is defined for convenience in calculations
    if (this.dview[0] < this.dview[2]) {
        this.x = this.dview[0];
        this.x2 = this.dview[2];
    } else {
        this.x = this.dview[2];
        this.x2 = this.dview[0];
    }
    if (this.dview[1] < this.dview[3]) {
        this.y = this.dview[1];
        this.y2 = this.dview[3];
    } else {
        this.y = this.dview[3];
        this.y2 = this.dview[1];
    }
    this.width = this.x2 - this.x;
    this.height = this.y2 - this.y;
    this.recompute_svg = true;
}

///
/// Region shape : circle
///
function _via_region_circle() {
    this.is_inside = _via_region_circle.prototype.is_inside;
    this.is_on_edge = _via_region_circle.prototype.is_on_edge;
    this.move = _via_region_circle.prototype.move;
    this.resize = _via_region_circle.prototype.resize;
    this.initialize = _via_region_circle.prototype.initialize;
    this.dist_to_nearest_edge = _via_region_circle.prototype.dist_to_nearest_edge;
}

_via_region_circle.prototype.initialize = function () {
    this.cx = this.dview[0];
    this.cy = this.dview[1];
    var dx = this.dview[2] - this.dview[0];
    var dy = this.dview[3] - this.dview[1];
    this.r = Math.round(Math.sqrt(dx * dx + dy * dy));
    this.r2 = this.r * this.r;
    this.recompute_svg = true;
}


///
/// Region shape : ellipse
///
function _via_region_ellipse() {
    this.is_inside = _via_region_ellipse.prototype.is_inside;
    this.is_on_edge = _via_region_ellipse.prototype.is_on_edge;
    this.move = _via_region_ellipse.prototype.move;
    this.resize = _via_region_ellipse.prototype.resize;
    this.initialize = _via_region_ellipse.prototype.initialize;
    this.dist_to_nearest_edge = _via_region_ellipse.prototype.dist_to_nearest_edge;
}

_via_region_ellipse.prototype.initialize = function () {
    this.cx = this.dview[0];
    this.cy = this.dview[1];
    this.rx = Math.abs(this.dview[2] - this.dview[0]);
    this.ry = Math.abs(this.dview[3] - this.dview[1]);

    this.inv_rx2 = 1 / (this.rx * this.rx);
    this.inv_ry2 = 1 / (this.ry * this.ry);

    this.recompute_svg = true;
}



///
/// Region shape : line
///
function _via_region_line() {
    this.is_inside = _via_region_line.prototype.is_inside;
    this.is_on_edge = _via_region_line.prototype.is_on_edge;
    this.move = _via_region_line.prototype.move;
    this.resize = _via_region_line.prototype.resize;
    this.initialize = _via_region_line.prototype.initialize;
    this.dist_to_nearest_edge = _via_region_line.prototype.dist_to_nearest_edge;
}

_via_region_line.prototype.initialize = function () {
    this.x1 = this.dview[0];
    this.y1 = this.dview[1];
    this.x2 = this.dview[2];
    this.y2 = this.dview[3];
    this.dx = this.x1 - this.x2;
    this.dy = this.y1 - this.y2;
    this.mconst = (this.x1 * this.y2) - (this.x2 * this.y1);

    this.recompute_svg = true;
}


///
/// Region shape : polyline
///
function _via_region_polyline() {
    this.is_inside = _via_region_polyline.prototype.is_inside;
    this.is_on_edge = _via_region_polyline.prototype.is_on_edge;
    this.move = _via_region_polyline.prototype.move;
    this.resize = _via_region_polyline.prototype.resize;
    this.initialize = _via_region_polyline.prototype.initialize;
    this.dist_to_nearest_edge = _via_region_polyline.prototype.dist_to_nearest_edge;
}

_via_region_polyline.prototype.initialize = function () {
    var n = this.dview.length;
    var points = new Array(n / 2);
    var points_index = 0;
    for (var i = 0; i < n; i += 2) {
        points[points_index] = (this.dview[i] + ' ' + this.dview[i + 1]);
        points_index++;
    }
    this.points = points.join(',');
    this.recompute_svg = true;
}


///
/// Region shape : polygon
///
function _via_region_polygon() {
    this.is_inside = _via_region_polygon.prototype.is_inside;
    this.is_on_edge = _via_region_polygon.prototype.is_on_edge;
    this.move = _via_region_polygon.prototype.move;
    this.resize = _via_region_polygon.prototype.resize;
    this.initialize = _via_region_polygon.prototype.initialize;
    this.dist_to_nearest_edge = _via_region_polygon.prototype.dist_to_nearest_edge;
}

_via_region_polygon.prototype.initialize = function () {
    var n = this.dview.length;
    var points = new Array(n / 2);
    var points_index = 0;
    for (var i = 0; i < n; i += 2) {
        points[points_index] = (this.dview[i] + ' ' + this.dview[i + 1]);
        points_index++;
    }
    this.points = points.join(',');
    this.recompute_svg = true;
}


///
/// Region shape : point
///
function _via_region_point() {
    this.is_inside = _via_region_point.prototype.is_inside;
    this.is_on_edge = _via_region_point.prototype.is_on_edge;
    this.move = _via_region_point.prototype.move;
    this.resize = _via_region_point.prototype.resize
    this.initialize = _via_region_point.prototype.initialize;
    this.dist_to_nearest_edge = _via_region_point.prototype.dist_to_nearest_edge;
}

_via_region_point.prototype.initialize = function () {
    this.cx = this.dview[0];
    this.cy = this.dview[1];
    this.r = 2;
    this.r2 = this.r * this.r;
    this.recompute_svg = true;
}

//
// image buffering
//

function _via_buffer_hide_current_image() {
    //img_fn_list_ith_entry_selected(_via_image_index, false);
    _via_clear_reg_canvas(); // clear old region shapes
}

function _via_show_img_from_buffer(img_index) {
    _via_current_image = document.getElementById("currentImage");
    _via_current_image.classList.add('visible'); // now show the new image

    // update the current state of application
    _via_click_x0 = 0;
    _via_click_y0 = 0;
    _via_click_x1 = 0;
    _via_click_y1 = 0;
    _via_is_user_drawing_region = false;
    _via_is_window_resized = false;
    _via_is_user_resizing_region = false;
    _via_is_user_moving_region = false;
    _via_is_user_drawing_polygon = false;
    _via_is_region_selected = false;
    _via_user_sel_region_id = -1;
    _via_current_image_width =  RA_IMAGE_WIDTH; //_via_current_image.naturalWidth; // 350
    _via_current_image_height = RA_IMAGE_HEIGHT; //_via_current_image.naturalHeight; // 420

    _via_canvas_width = _via_current_image_width;
    _via_canvas_height = _via_current_image_height;
    set_all_canvas_size(_via_canvas_width, _via_canvas_height);
    //set_all_canvas_scale(_via_canvas_scale_without_zoom);

    // reset all regions to "not selected" state
    toggle_all_regions_selection(false);

    // ensure that all the canvas are visible
    //set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE);

    _via_load_canvas_regions(); // image to canvas space transform
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();

    // Preserve zoom level
    if (_via_is_canvas_zoomed) {
        set_zoom(_via_canvas_zoom_level_index);
    }
}


//
// utils
//

function is_url(s) {
    // @todo: ensure that this is sufficient to capture all image url
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('www.')) {
        return true;
    } else {
        return false;
    }
}

function get_filename_from_url(url) {
    return url.substring(url.lastIndexOf('/') + 1);
}

function fixfloat(x) {
    return parseFloat(x.toFixed(VIA_FLOAT_PRECISION));
}

function shape_attribute_fixfloat(sa) {
    for (var attr in sa) {
        switch (attr) {
            case 'x':
            case 'y':
            case 'width':
            case 'height':
            case 'r':
            case 'rx':
            case 'ry':
                sa[attr] = fixfloat(sa[attr]);
                break;
            case 'all_points_x':
            case 'all_points_y':
                for (var i in sa[attr]) {
                    sa[attr][i] = fixfloat(sa[attr][i]);
                }
        }
    }
}

// start with the array having smallest number of elements
// check the remaining arrays if they all contain the elements of this shortest array
function array_intersect(array_list) {
    if (array_list.length === 0) {
        return [];
    }
    if (array_list.length === 1) {
        return array_list[0];
    }

    var shortest_array = array_list[0];
    var shortest_array_index = 0;
    var i;
    for (i = 1; i < array_list.length; ++i) {
        if (array_list[i].length < shortest_array.length) {
            shortest_array = array_list[i];
            shortest_array_index = i;
        }
    }

    var intersect = [];
    var element_count = {};

    var array_index_i;
    for (i = 0; i < array_list.length; ++i) {
        if (i === 0) {
            // in the first iteration, process the shortest element array
            array_index_i = shortest_array_index;
        } else {
            array_index_i = i;
        }

        var j;
        for (j = 0; j < array_list[array_index_i].length; ++j) {
            if (element_count[array_list[array_index_i][j]] === (i - 1)) {
                if (i === array_list.length - 1) {
                    intersect.push(array_list[array_index_i][j]);
                    element_count[array_list[array_index_i][j]] = 0;
                } else {
                    element_count[array_list[array_index_i][j]] = i;
                }
            } else {
                element_count[array_list[array_index_i][j]] = 0;
            }
        }
    }
    return intersect;
}

function generate_img_index_list(input) {
    var all_img_index_list = [];

    // condition: count format a,b
    var count_format_img_index_list = [];
    if (input.prev_next_count.value !== '') {
        var prev_next_split = input.prev_next_count.value.split(',');
        if (prev_next_split.length === 2) {
            var prev = parseInt(prev_next_split[0]);
            var next = parseInt(prev_next_split[1]);
            var i;
            for (i = (_via_image_index - prev); i <= (_via_image_index + next); i++) {
                count_format_img_index_list.push(i);
            }
        }
    }
    if (count_format_img_index_list.length !== 0) {
        all_img_index_list.push(count_format_img_index_list);
    }

    //condition: image index list expression
    var expr_img_index_list = [];
    if (input.img_index_list.value !== '') {
        var img_index_expr = input.img_index_list.value.split(',');
        if (img_index_expr.length !== 0) {
            var i;
            for (i = 0; i < img_index_expr.length; ++i) {
                if (img_index_expr[i].includes('-')) {
                    var ab = img_index_expr[i].split('-');
                    var a = parseInt(ab[0]) - 1; // 0 based indexing
                    var b = parseInt(ab[1]) - 1;
                    var j;
                    for (j = a; j <= b; ++j) {
                        expr_img_index_list.push(j);
                    }
                } else {
                    expr_img_index_list.push(parseInt(img_index_expr[i]) - 1);
                }
            }
        }
    }
    if (expr_img_index_list.length !== 0) {
        all_img_index_list.push(expr_img_index_list);
    }


    // condition: regular expression
    var regex_img_index_list = [];
    if (input.regex.value !== '') {
        var regex = input.regex.value;
        for (var i = 0; i < _via_image_filename_list.length; ++i) {
            var filename = _via_image_filename_list[i];
            if (filename.match(regex) !== null) {
                regex_img_index_list.push(i);
            }
        }
    }
    if (regex_img_index_list.length !== 0) {
        all_img_index_list.push(regex_img_index_list);
    }

    var intersect = array_intersect(all_img_index_list);
    return intersect;
}


// pts = [x0,y0,x1,y1,....]
function polygon_to_bbox(pts) {
    var xmin = +Infinity;
    var xmax = -Infinity;
    var ymin = +Infinity;
    var ymax = -Infinity;
    for (var i = 0; i < pts.length; i = i + 2) {
        if (pts[i] > xmax) {
            xmax = pts[i];
        }
        if (pts[i] < xmin) {
            xmin = pts[i];
        }
        if (pts[i + 1] > ymax) {
            ymax = pts[i + 1];
        }
        if (pts[i + 1] < ymin) {
            ymin = pts[i + 1];
        }
    }
    return [xmin, ymin, xmax - xmin, ymax - ymin];
}