/**
 * Объект для взаимодействия с SGF файлами
 *
 * Может парсить их и обходить ноды
 *
 */
function tree(sgf) {
    return new tree.prototype.init(sgf);
}

tree.fn = tree.prototype = {
    init: function (sgf) {
        this._tree = sgf && this.parse(sgf) || [{}];
    },

    headers: function () {
        return this._tree[0];
    },

    graph: function () {
        console.dirxml(this._tree);
    },

    parse: function (sgf) {
        var _this = this;

        sgf = sgf.replace(/\)|\(|;((?:\w+(?:\[(?:\\\]|.)*?\])+)+)/g, function (m, p1) {
            switch (m) {
            case ')':
                return '],';
            case '(':
                return '[';
            default:
                return '{' + _this.parseNode(p1) + '},';
            }
        });

        sgf = sgf.replace(/,(\]|}|$)/g, function (m, p1) {
            return p1 || '';
        });

        return JSON.parse(sgf);
    },

    parseNode: function (node) {
        return node.replace(/(\w+)((?:\[(?:\\\]|.)*?\])+)/g, function (m, p1, p2) {
            if (/\]\[/g.test(p2)) {
                p2 = '[' + p2.replace(/\[((?:\\\]|.)*?)\]/g, '"$1",') + '],';
            } else {
                p2 = p2.replace(/\[((?:\\\]|.)*?)\]/g, '"$1",');
            }

            return '"' + p1.toLowerCase() + '":' + p2;
        });
    }
};

tree.fn.init.prototype = tree.fn;

/**
 * Методы:
 *
 * Перемещение по узлам
 * Формирование узла
 * Инициализация вью-модели
 * Получение данных из вью-модели
 * Фиксация изменений в модели
 *
 * Два способа перемещения по узлам:
 * с полным перестроением доски
 * с локальными изменениями (применение изменений за каждый промежуточный узел)
 *
 */
var model = Backbone.Model.extend({

    defaults: function () {
        return {
            // FF: File format: version of SGF specification governing this SGF file.
            // GM: Game: type of game represented by this SGF file. A property value of 1 refers to Go.
            // SZ: Size: size of the board, non square boards are supported.
            sgf: '(;FF[4]GM[1]SZ[19])'
        };
    },

    initialize: function () {
        this._tree = new tree(this.get('sgf'));
        // Описание текущего состояния (камни + метки)
        this._scheme = {
            marking: {},
            stones: {}
        };
    },

    // Применение промежуточных изменений
    moveBy: function () {},

    // Перерисовка доски до конкретного узла
    moveTo: function () {},

    // Парсит узел SGF
    parse: function () {},

    // Добавляем данные в буффер текущего узла
    buf: function () {},

    // Фиксация изменений (буфер), переход к следующему узлу
    fix: function () {}

    // Методы для формирования данных схемы
    // Методы для отрисовки всей схемы или локальных изменений (вьюха)
});

/**
 * Внутри три слоя: гобан, камни, метки
 *
 * Представление данных: объект с камнями и объект с метками
 * свойство содержит координаты: "10.11", значение: обозначение камня / метки
 *
 * Можно создать вью-модельку, которая будет хранить данные о доске
 * Два объекта с текущим состоянием (камни и метки), а также объект с изменениями
 *
 */
var SGF = Backbone.View.extend({

    tagName: 'div',

    className: 'scheme',

    // Создаем слои
    // Подписываемся на события
    initialize: function () {
        // Ссылки на вьюхи
        this._layers = {
            goban: null,
            marking: null,
            stones: null
        };
    },

    draw: function (stones, marking, goban) {},

    // Отрисовать SGF, описанную в модели (доска + model._scheme)
    render: function () {}
});
