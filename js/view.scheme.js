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
var schemeModel = Backbone.Model.extend({
    
    defaults: function () {
        return {
            colors: {
                bg:   '#efdbb8',// '#d9af5b',
                line: '#7a6652'// '#665544'
            },
            hasMarking: true,
            lgth: null
        };
    },

    initialize: function () {
        this.set('tree', tree(this.get('sgf')));
    },

    hasMarking: function () {
        return this.get('hasMarking');
    },

    size: function () {
        return this.get('size');
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
var schemeView = Backbone.View.extend({
    
    tagName: 'div',

    className: 'scheme',

    events: {
        'click': 'handleClick'
    },

    initialize: function () {
        this._layers = {};

        this.listenTo(this.model, 'change:lgth', this.setDimensions);
        /*this.listenTo(this.model, 'vm:clear');
        this.listenTo(this.model, 'vm:change');
        this.listenTo(this.model, 'vm:redraw');*/
    },

    handleClick: function (e) {
        var off = this.$el.offset(),
            x = e.pageX - off.left,
            y = e.pageY - off.top;

        e.stopPropagation();
        console.log(x, y);
    },

    setDimensions: function (state) {
        var lgth = state.get('lgth'),
            ps = [],
            frame,
            unit;

        if (state.hasMarking()) {
            unit = Math.round((lgth - .5) / 21.5);
            frame = (lgth - unit * 18) / 2;
        } else {
            unit = Math.round((lgth - .5) / 19.5);
            frame = (lgth - unit * 18) / 2;
        }

        for (var i = 0; i < 19; i++) {
            ps.push(Math.round(unit * i + frame));
        }

        state.set({
            frame: frame,
            unit: unit,
            ps: ps
        });
    },

    figures: {

        goban: function (state) {
            var colors = state.get('colors'),
                ps = state.get('ps'),
                lgth = state.get('lgth'),
                unit = state.get('unit'),
                frame = state.get('frame');

            if (state.hasMarking()) {
                this.apply('beginPath')
                    .prop({ fillStyle: colors.line })
                    .fillRect({
                        x0: 0,
                        y0: 0,
                        w: lgth,
                        h: lgth
                    })
                    .prop({ fillStyle: colors.bg })
                    .fillRect({
                        x0: unit,
                        y0: unit,
                        w: lgth - 2 * unit,
                        h: lgth - 2 * unit
                    });

                // Разметка
                var fontSize = Math.round(unit / 2),
                    letters = 'ABCDEFGHJKLMNOPQRST'.split('');

                this.prop({
                        font: fontSize + 'px Helvetica,Arial',
                        textAlign: 'center',
                        strokeStyle: colors.bg
                    })
                    .apply('beginPath');

                for (var i = 0; i < 19; i++) {
                    this.fillText({
                            t: 19 - i,
                            x0: fontSize,
                            y0: ps[i] + fontSize / 2
                        })
                        .fillText({
                            t: 19 - i,
                            x0: lgth - fontSize,
                            y0: ps[i] + fontSize / 2
                        })
                        .fillText({
                            t: letters[i],
                            x0: ps[i],
                            y0: fontSize * 1.5
                        })
                        .fillText({
                            t: letters[i],
                            x0: ps[i],
                            y0: lgth - fontSize / 2
                        });
                }
            } else {
                this.apply('beginPath')
                    .prop({ fillStyle: colors.bg })
                    .fillRect({
                        x0: 0,
                        y0: 0,
                        w: lgth,
                        h: lgth
                    });
            }

            // Сетка
            this.prop({ strokeStyle: colors.line });

            for (var i = 0; i < 19; i++) {
                this.line({
                        x0: frame + .5,
                        y0: ps[i] + .5,
                        x1: lgth - frame + .5,
                        y1: ps[i] + .5
                    })
                    .line({
                        x0: ps[i] + .5,
                        y0: frame + .5,
                        x1: ps[i] + .5,
                        y1: lgth - frame + .5
                    });
            }

            this.apply('stroke');

            // Хоси
            var pss = [],
                w0 = Math.ceil(unit / 10),
                w1 = 2 * w0 + 1;

            this.prop({ fillStyle: colors.line });

            for (var i = 3; i < 19; i += 6) {
                pss.push(Math.round(ps[i] - w0));
            }

            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    this.fillRect({
                        x0: pss[i],
                        y0: pss[j],
                        w: w1,
                        h: w1
                    });
                }
            }
        }
    },

    draw: function (attr) {
        var src = this.layer(attr.layer),
            method = this.figures[attr.figure];

        method.call(src, this.model);
    },

    addLayer: function (name) {
        var layer = new Canvas;

        layer.size(this.model.size());
        layer.el.classList.add(name);
        this.layer(name, layer);

        return layer;
    },

    layer: function (name, source) {
        if (source === undefined) {
            return this._layers[name];
        } else {
            this._layers[name] = source;
        }
    },

    render: function () {
        // Пересчитываем размеры
        var w = this.$el.width(),
            h = this.$el.height();

        this.model.set({
            size: {
                w: w,
                h: h
            },
            lgth: Math.min(w, h) // Триггерит метод setDimensions
        });

        this.addLayer('goban');
        this.draw({
            layer: 'goban',
            figure: 'goban'
        });

        this.$el
            .empty()
            .append(
                this.layer('goban').el
            );
    }
});