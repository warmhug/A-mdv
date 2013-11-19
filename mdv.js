/**
 * Created by hualei on 13-10-19.
 *
 *  my simple mdv library
 */
;(function(global, undefined){

    function isString(value){return typeof value == 'string';}
    var lowercase = function(string){return isString(string) ? string.toLowerCase() : string;};
    var uppercase = function(string){return isString(string) ? string.toUpperCase() : string;};
    var manualLowercase = function(s) {
        return isString(s)
            ? s.replace(/[A-Z]/g, function(ch) {return String.fromCharCode(ch.charCodeAt(0) | 32);})
            : s;
    };
    var manualUppercase = function(s) {
        return isString(s)
            ? s.replace(/[a-z]/g, function(ch) {return String.fromCharCode(ch.charCodeAt(0) & ~32);})
            : s;
    };
    if ('i' !== 'I'.toLowerCase()) {
        lowercase = manualLowercase;
        uppercase = manualUppercase;
    }
    function trim(value) {
        return isString(value) ? value.replace(/^\s*/, '').replace(/\s*$/, '') : value;
    }
    var toString = Object.prototype.toString;
    var slice    = [].slice;
    function isFunction(value){return typeof value == 'function';}
    function isString(value){return typeof value == 'string';}

    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    function getParamNames(func) {
        var fnStr = func.toString().replace(STRIP_COMMENTS, '')
        var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g)
        if(result === null)
            result = []
        return result
    }

    /*
    *    from zepto.js
    * */
    function type(obj) {
        return obj == null ? String(obj) :
            {}[{}.toString.call(obj)] || "object"
    }
    function isWindow(obj)     { return obj != null && obj == obj.window }
    function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
    function isObject(obj)     { return type(obj) == "object" }
    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
    }
    function isArray(value) { return value instanceof Array }
    function _extend(target, source, deep) {
        for (key in source)
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {}
                if (isArray(source[key]) && !isArray(target[key]))
                    target[key] = []
                _extend(target[key], source[key], deep)
            }
            else if (source[key] !== undefined) target[key] = source[key]
    }
    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    function extend (target){
        var deep, args = slice.call(arguments, 1)
        if (typeof target == 'boolean') {
            deep = target
            target = args.shift()
        }
        args.forEach(function(arg){ _extend(target, arg, deep) })
        return target
    }

    /**
     *
         //extend简要实现
         function extend(destination, source){
            var value 	 = null;
            var property = null;
            if (destination && source) {
                for (property in source) {
                    value = source[property];
                    if (value !== undefined) {
                        destination[property] = (typeof(value) == 'object' && !(value.nodeType) && !(value instanceof Array)) ? extend({}, value) : value;
                    }
                }
                if (source.hasOwnProperty && source.hasOwnProperty('toString')) {
                    destination.toString = source.toString;
                }
            }
            return destination;
        }

     */

    function search_obj(obj, key) {
        var result = [];
        function search(obj, key) {
            for (var o in obj) {
                if(o == key) result.push(obj[o]);
                if(Object.prototype.toString.call(obj[o]) == '[object Object]'){
                    search(obj[o], key);
                }
            }
        }
        search(obj, key);
        return result;
    }

    var mdv = {}, doc = global.document;
    var vm = {}, repeat_level = {};
    var root;

    function app_init() {
        var app_flag = '[mdv-app]', app_element;
        if(!(app_element = doc.querySelector(app_flag))) return;

        compile();
    }

    //编译html
    function compile() {
        var ctrl_flag = 'mdv-controller', ctrl_element, ctrl_fn;
        ctrl_element = doc.querySelector('['+ctrl_flag+']');
        ctrl_fn = ctrl_element.getAttribute(ctrl_flag);

        root = {
            ctrl_element: ctrl_element,
            ctrl_fn: ctrl_fn
        };

        traverse_dom(ctrl_element, root, vm);
        console.log('root obj: ', root);

        var arr = search_obj(root, 'data');
        console.log('root["data"]: ', arr);
        console.log('vm ', vm);

        console.log('repeat_level ', repeat_level);


    }

    // 遍历dom
    var level_j = -1;
    function traverse_dom(element, root, vm, parent_sign) {
        var firstChild = element.firstChild,
            type,
            i = 0,
            illegal = function (node) {
                type = node.nodeType;
                if(type == 8 || type == 3 && trim(node.nodeValue) == '') return true;
            };
        if(firstChild) {
            level_j++;
            do{
                if(illegal(firstChild)) continue;

                var sign = level_j + '_' + i;
                if(parent_sign) sign += '_parent_' + parent_sign;
                !repeat_level[sign] && (repeat_level[sign] = {});
                collect_directives(firstChild, i, sign, root, vm);
                i++;

            } while(firstChild = firstChild.nextSibling);
            level_j--;
        }
    }

    //node类型
    //收集指令
    function collect_directives(node, j, sign, root, vm) {
        var new_root;
        switch (node.nodeType) {
            case 1:  //element
                var key = 'elem_' + j + '_'+ lowercase(node.nodeName);
                new_root = root[key] = {};
                new_root['node'] = node;
                new_root['children'] = {};

                // 解析 mdv-repeat
                parse_mdv_repeat(node, sign, new_root, vm);

                var attrValue, new_attrValue;
                var i = 0, name, attr, attrs = node.attributes, len = attrs && attrs.length;
                for (; i < len; i++) {
                    attr = attrs[i];
                    if (attr.specified) {
                        name = attr.name;
                        attrValue = attr.nodeValue;
                        switch (name) {
                            case 'mdv-repeat':
                                break;
                            case 'mdv-class':
                                new_attrValue = parse_mdv_class(attrValue, sign);
                                new_attrValue && (new_root['data_attr_' + name] = new_attrValue);
                                break;
                            case 'mdv-click':
                                new_attrValue = trim(attrValue).replace('()', '');  //todo 处理参数
                                !vm[new_attrValue] && (vm[new_attrValue] = function(){});
                                break;
                            default:
                                new_attrValue = parse_mustache(attrValue, 'attrValue', sign);
                                new_attrValue && (new_root['data_attr_' + name] = new_attrValue);
                        }
                    }
                }
                //level_j++;
                traverse_dom(node, root[key]['children'], vm, sign);
                break;
            case 3:  //text

                delete repeat_level[sign];

                var text_node_key = 'text_node_' + j,
                new_root = root[text_node_key] = {};
                new_root['node'] = node;

                var n_text_value = parse_mustache(node.nodeValue, 'textNodeValue', sign);
                n_text_value && (new_root['data_textNode'] = n_text_value);

                break;
        }
    }

    //解析mdv-repeat
    function parse_mdv_repeat(node, sign, root, vm) {
        var attrValue,
            repeat_arr,
            key, arr;
        if(attrValue = trim(node.getAttribute('mdv-repeat'))){
            //attrValue: eq.. 'item in item.xx'
            repeat_arr = attrValue.split(' ');
            if(3 == repeat_arr.length && 'in' == repeat_arr[1]){
                //创建注释，作为插入元素的标记位置
                var comment = document.createComment('mdv-repeat: '+ attrValue);
                node.parentNode.insertBefore(comment, node);
                root['repeat_comment'] = comment;
                root['repeat_cloneNode'] = node.cloneNode(true);

                arr = repeat_arr[2];
                key = repeat_arr[0];

                var arr_arr = arr.split('.'),
                    arr_key, arr_val;
                if(2 == arr_arr.length){
                    arr_key = arr_arr[0];
                    arr_val = arr_arr[1];

                    var repeat_parent, repeat_parent_0, repeat_parent_1,
                        index = sign.indexOf('_parent_'),
                        parent = index > -1 && sign.substr(index + 8); //'_parent_'.length == 8
                    do{
                        if((repeat_parent = repeat_level[parent])){
                            repeat_parent_0 = repeat_parent[0];
                            repeat_parent_1 = repeat_parent[1];
                            if(arr_key == repeat_parent_0 && repeat_parent_1.indexOf('.') == -1){
                                arr = repeat_parent_1 + '[$index]' + '[' + arr_val + ']';
                                break;
                            } else {
                                continue;
                            }
                        }
                    } while((index = parent.indexOf('_parent_')) && index > -1 && (parent = parent.substr(index + 8)))

                } else {
                    !vm[arr] && (vm[arr] = []);
                }

                repeat_level[sign] = [key, arr];

                root['repeat_level'] = {
                    sign: sign,
                    key: key,
                    arr: arr
                }

                /*// 设置默认值
                var vm_arr = vm[arr];
                vm_arr.$index = 0;
                vm_arr.$first = true;
                vm_arr.$last = true;

                vm_arr.key_aliases = key;
                vm_arr.key = vm_arr[vm_arr.$index];*/

            }
        } else {
            delete repeat_level[sign];
        }
    }

    //解析出{{ }}
    function parse_mustache(text, type, sign) {
        var startSymbol = '{{',
            endSymbol = '}}',
            startSymbolLength = startSymbol.length,
            endSymbolLength = endSymbol.length,
            startIndex,
            endIndex,
            index = 0,
            len = text.length,
            exp,
            parts = [];

        if(!text.match(/.*{{.+}}.*/)) return;

        while(index < len){
            if ( ((startIndex = text.indexOf(startSymbol, index)) != -1) &&
                ((endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) != -1) ){
                exp = text.substring(startIndex + startSymbolLength, endIndex);
                index = endIndex + endSymbolLength;

                //处理带点的exp，eg. item.text
                exp = check_model(exp, sign);

                parts.push(exp);
            } else {
                //(index != length) && parts.push(text.substring(index));
                index = len;
            }
        }
        parts.sign = sign;
        return {
            data: parts,
            text: text.replace(/{{/g, "'+").replace(/}}/g, "+'").replace(/^/, "'").replace(/$/, "'").replace(/\r\n/g,'')
        }

        /*if(type == 'attrValue'){
            return text.replace(/{{/g, "'+").replace(/}}/g, "+'").replace(/^/, "'").replace(/$/, "'");
        } else if(type == 'textNodeValue'){
            return text.replace(/{{/g, "'+").replace(/}}/g, "+'").replace(/^/, "'").replace(/$/, "'").replace(/\r\n/g,'');
        }*/
    }

    //检测出model
    function check_model(exp, sign) {
        if(!repeat_level) return exp;

        var exp_key, exp_val, exp_arr= exp.split('.');
        if(2 == exp_arr.length){
            exp_key = exp_arr[0];
            exp_val = exp_arr[1];
        } else {
            exp_key = exp;
        }
        var fact,
            repeat_arr = repeat_level[sign],
            index = sign.indexOf('_parent_'),
            parent = index > -1 && sign.substr(index + 8); //'_parent_'.length == 8
        var check_key = function () {
            switch (exp_key){
                case '$index':
                    fact = repeat_arr[1] + '.$index-num';
                    return true;
                case '$first':
                    return true;
                case '$last':
                    return true;
                default:
                    if(exp_key == repeat_arr[0]){
                        var arr_1 = repeat_arr[1];

                        //
                        //config_vm(arr_1);

                        if(exp_val)
                            fact = arr_1 + '[$index]' + '[' + exp_val + ']';
                        else
                            fact = arr_1 + '[$index]';
                        return true;
                    }
            }
        };
        if(repeat_arr){
            check_key();
        } else if(parent){
            do{
                if((repeat_arr = repeat_level[parent]) && check_key()){
                    break;
                } else {
                    continue;
                }
            } while((index = parent.indexOf('_parent_')) && index > -1 && (parent = parent.substr(index + 8)))

        }

        if(fact){
            config_vm(fact);
            return {
                'origin': exp,
                'fact': fact
            }
        } else {
            config_vm(exp);
            return exp;
        }
    }

    //装配vm
    function config_vm(model) {

        var num_index = model.indexOf('.$index-num');
        if(num_index > -1) model = model.substr(0, num_index);

        var arr_1_arr = model.split('[$index]');
        var i = 0, vm_arr = vm[arr_1_arr[i]];
        do {
            var arr_i = arr_1_arr[i];
            var arr_i1 = arr_1_arr[i+1];
            if(arr_i1){
                //!vm[arr_i] && (vm[arr_i] = []);
                if(i !== 0){
                    arr_i = arr_i.replace(/^\s*\[|\]\s*$/g, '');
                    vm_arr = vm_arr[0][arr_i];
                }
                !vm_arr && (vm_arr = []);

                arr_i1 = arr_i1.replace(/^\s*\[|\]\s*$/g, '');
                var arr_i_0 = vm_arr[0];
                if(arr_i_0){
                    if(toString.call(arr_i_0) !== '[object Object]'){
                        arr_i_0 = {};
                    }
                    if(arr_1_arr[i+2]) arr_i_0[arr_i1] = [];
                    else if(!arr_i_0[arr_i1]) arr_i_0[arr_i1] = '';
                } else {
                    var new_obj = {};
                    if(arr_1_arr[i+2]) new_obj[arr_i1] = [];
                    else if(!new_obj[arr_i1]) new_obj[arr_i1] = '';
                    vm_arr.push(new_obj);
                }
            } else {
                !vm_arr && (vm[arr_i] = '');
                break;
            }
            i++;
        } while (arr_1_arr[i])
    }

    //解析mdv-class
    function parse_mdv_class(text, sign) {
        text = text.replace(/\s+|{|}/g, '');
        var kvs = text.split(','), kv_arr, ks = [], vs = [];
        for (var i = 0; i < kvs.length; i++) {
            var kv = kvs[i];
            kv_arr = kv.split(':');
            if(2 != kv_arr.length) continue;
            ks.push(kv_arr[0].replace(/^'|'$/g, ''));

            //解析model
            var new_class_model = check_model(kv_arr[1], sign);

            vs.push(new_class_model);
        }
        var ksl, vsl;
        if((ksl = ks.length) && (vsl = vs.length) && ksl == vsl) {
            vs.sign = sign;
            return {
                className: ks,
                data: vs
            }
        }
    }


    var user = {};

    function controller(ctrl_name, ctrl_fn) {
        if(!isString(ctrl_name)){
            console.log('the controller name should be String type');
            return;
        }
        if(!isFunction(ctrl_fn)){
            console.log('the controller function should be Function type');
            return;
        }
        user.ctrl_name = ctrl_name;
        user.ctrl_fn = ctrl_fn;
    }

    var previous_vm, current_vm;

    function deal_user_vm() {
        if(root && root['ctrl_fn'] === user.ctrl_name){
            var params = getParamNames(user.ctrl_fn),
                user_vm = {};
            //暂时，只允许controller函数存在一个参数
            if(1 !== params.length){
                console.log('controller function should have one param');
                return;
            }

            user.ctrl_fn(user_vm);
            //console.log(user_vm);

            //previous_vm = extend(true, {}, vm);
            current_vm = extend(true, {}, user_vm);
            console.log(previous_vm, current_vm);
        }
    }
    
    //数据链接dom
    function vm_link_dom() {
        
    }

    //脏检查
    function dirty_checking() {

    }

    //执行检查
    // mdv-click 指定的处理函数执行后；或者显式调用 $apply() 时
    function $apply(fn) {

    }

    doc.addEventListener('DOMContentLoaded',function(){
        app_init();
        deal_user_vm();
    }, false);

    mdv.controller = controller;
    mdv.$apply = $apply;
    global.mdv = mdv;

    /*
     * 仅支持一个controller
     * */

    /*  扩展：
    *
    *  多个controller 关系：
    *  父子 -- vm 原型继承
    *  兄弟 -- vm 兄弟关系
    *
    * */

})(this);