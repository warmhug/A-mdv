/**
 * Created by hualei on 13-10-19.
 */

var data={
    nav:[
        {cur: true, me: true, text: '列表一'},
        {cur: false, me: true, text: '列表二'},
        {cur: false, me: true, text: '列表三'}
    ],
    t:{
        time: Date()
    },
    content:[
        {name: 'aaa', age: '16', words: ['one', 'two', 'three']},
        {name: 'bbb', age: '17'},
        {name: 'ccc', age: '18'},
        {name: 'ddd', age: '19'},
        {name: 'eee', age: '20'},
        {name: 'fff', age: '21'},
        {name: 'ggg', age: '22'}
    ]
};

function main(vm) {
    vm.nav = data.nav;
    vm.time = data.t.time;
    vm.content = data.content;
    vm.do = function (index) {
        for (var i = 0; i < vm.nav.length; i++) {
            var obj = vm.nav[i];
            if(i !== index) obj.cur = false;
            else obj.cur = true;
        }
    }
    /**
     *     //watch后续跟进
          vm.$watch('nav', function (value, old) {
                console.log(value, old);
           });
     */

}

mdv.controller('main', main);
