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
        this._scheme = {};

        this.trigger('change:redraw', this._scheme);
    },

    // Применение промежуточных изменений
    moveBy: function () {},

    // Перерисовка доски до конкретного узла
    moveTo: function () {},

    // Добавление камня на доску
    add: function (data) {},

    // Добавляем данные в буффер текущего узла
    buf: function (data) {},

    extend: function (destination, source, silent) {
        if (!silent) {
            this.trigger('view:change', source);
        }
    }
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

        this.listenTo(this.model, 'change:clear');
        this.listenTo(this.model, 'change:change');
        this.listenTo(this.model, 'change:redraw');
    },

    colors: {
        bg:   '#efdbb8',// '#d9af5b',
        line: '#7a6652'// '#665544'
    },

    figures: {
        ab: function () {},
        aw: function () {},
        b: function (x, y, s) {},
        w: function (x, y, s) {},
        goban: function (w, h, colors, text) {
            var l = Math.min(h, w);
            var s,b,e;

            // Закрашиваем доску
            if (text) {
                // С разметкой
                s = Math.round((l - .5) / 21.5);
                b = (l - s * 18) / 2,
                e = l - b;

                this.apply('beginPath')
                    .prop({ fillStyle: colors.line })
                    .fillRect({
                        x0: 0,
                        y0: 0,
                        w: l,
                        h: l
                    })
                    .prop({ fillStyle: colors.bg })
                    .fillRect({
                        x0: s,
                        y0: s,
                        w: l - 2 * s,
                        h: l - 2 * s
                    });

                // Разметка
                var fs = Math.round(s / 2),
                    letter = 'ABCDEFGHJKLMNOPQRST'.split('');

                this.prop({
                        font: fs + 'px Helvetica,Arial',
                        textAlign: 'center',
                        strokeStyle: colors.bg
                    })
                    .apply('beginPath');

                for (var x0 = l - fs, y0 = fs * 1.5, y1 = l - fs / 2, y2, z, i = 0; i < 19; i++) {
                    z = b + s * i;
                    y2 = z + fs / 2;

                    this.fillText({
                            t: 19 - i,
                            x0: fs,
                            y0: y2
                        })
                        .fillText({
                            t: 19 - i,
                            x0: x0,
                            y0: y2
                        })
                        .fillText({
                            t: letter[i],
                            x0: z,
                            y0: y0
                        })
                        .fillText({
                            t: letter[i],
                            x0: z,
                            y0: y1
                        });
                }
            } else {
                // Без разметки
                s = Math.round((l - .5) / 19.5);
                b = (l - s * 18) / 2,
                e = l - b;

                this.apply('beginPath')
                    .prop({ fillStyle: colors.bg })
                    .fillRect({
                        x0: 0,
                        y0: 0,
                        w: l,
                        h: l
                    });
            }

            // Разлиновываем доску
            this.prop({ strokeStyle: colors.line });

            for (var k, i = 0; i < 19; i++) {
                k = Math.round(s * i + b);

                this.line({
                        x0: b + .5,
                        y0: k + .5,
                        x1: e + .5,
                        y1: k + .5
                    })
                    .line({
                        x0: k + .5,
                        y0: b + .5,
                        x1: k + .5,
                        y1: e + .5
                    });
            }

            this.apply('stroke');

            // Хоси
            this.prop({ fillStyle: colors.line });

            var x = [],
                dx = Math.ceil(s / 10);

            for (var i = 4; i < 19; i += 6) {
                x.push(Math.round(s * (i - 1) + b) - dx);
            }

            for (var i = 0, dy = dx * 2 + 1; i < 3; i++ ) {
                this.fillRect({
                        x0: x[0],
                        y0: x[i],
                        w: dy,
                        h: dy
                    })
                    .fillRect({
                        x0: x[1],
                        y0: x[i],
                        w: dy,
                        h: dy
                    })
                    .fillRect({
                        x0: x[2],
                        y0: x[i],
                        w: dy,
                        h: dy
                    });
            }
        }
    },

    addLayer: function (name) {
        var layer = new Canvas;

        layer.size(this.$el.width(), this.$el.height());
        layer.el.classList.add(name);

        this._layers[name] = layer;

        return layer;
    },

    hasLayer: function (name) {
        return Boolean(this._layers[name]);
    },

    draw: function (param) {
        var src = this._layers[param.layer];
        var figure = param.figure;

        switch (figure) {
        case 'goban':
            this.figures[figure].call(
                src,
                src.$el.prop('width'),
                src.$el.prop('height'),
                this.colors,
                true
            );
            break;
        default:
            this.figures[figure].call(
                src,
                'x',
                'y',
                's'
            );
        }
    },

    // Отрисовать SGF, описанную в модели (доска + model._scheme)
    render: function () {
        if (!this.hasLayer('goban')) {
            this.addLayer('goban');
            this.draw({ layer: 'goban', figure: 'goban' });
        }

        if (!_.isEmpty(this.model._scheme)) {
            this.hasLayer('stones') || this.addLayer('stones');
            this.hasLayer('marking') || this.addLayer('marking');
        }

        this.$el
            .empty()
            .append(
                this._layers.goban.el
            );
    }
});
