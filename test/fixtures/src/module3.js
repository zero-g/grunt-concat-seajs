module1.js/**
 * Created by shaokaiming on 16/8/28.
 */

define(function(require, exports, module) {
    var container = document.getElementById('main'),
        divNode = document.createElement('p'),
        textNode = document.createTextNode('module3 loaded.');

    divNode.appendChild(textNode);
    container.appendChild(divNode);
    console.log('loaded!');
});
