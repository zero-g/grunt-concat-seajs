/**
 * Created by shaokaiming on 16/8/28.
 */

define(function(require, exports, module) {
    var container = document.getElementById('main'),
        divNode = document.createElement('p'),
        textNode = document.createTextNode('module1 loaded.');

    divNode.appendChild(textNode);
    divNode.setAttribute('id','module1');
    container.appendChild(divNode);
    console.log('loaded!');
});
