/**
 * Объект для хранения и передачи координат
 *
 */
function token(x, y) {
    if (typeof x === 'string') {
        this.literal = x;
        this.x = this.decode(this.literal.charAt(0));
        this.y = this.decode(this.literal.charAt(1));
    } else {
        this.x = x;
        this.y = y;
    }
}

token.prototype = {
    alpha: 'a'.charCodeAt(0),

    decode: function (x) {
        return x.charCodeAt(0) - this.alpha;
    },

    encode: function (x) {
        return String.fromCharCode(this.alpha + x);
    },

    toString: function (p) {
        if (!this.literal) {
            this.literal = this.encode(this.x) + this.encode(this.y);
        }

        return p === undefined ? this.literal : this.literal.charAt(p);
    },

    valueOf: function () {
        if (!this.x || !this.y) {
            this.x = this.decode(this.literal.charAt(0));
            this.y = this.decode(this.literal.charAt(1));
        }

        return {
            x: this.x,
            y: this.y
        };
    }
};

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
            // Наличие разметки
            hasMarking: true,
            // Минимум из ширины / высоты
            lgth: null,
            // Режим работы с гобаном
            type: 'b',
            // Буфер
            buf: {},
            // Диаграмма
            scheme: {}
        };
    },

    initialize: function () {
        this.set('tree', tree(this.get('sgf')));
    },

    // Нужно ли рисовать разметку вокруг доски
    hasMarking: function () {
        return this.get('hasMarking');
    },

    size: function () {
        return this.get('size');
    },

    // Логическая обработка клика
    // p: координаты
    // x: число
    // y: число
    add: function (data) {
        // Смотрим тип
        // Сверяем с тем, что есть
        // Вносим изменения
        console.log(data);
        data = {
            'b': data.p
        };
        this.trigger('vm:change', data);
    },

    // Проверяет вносимые изменения и дополняет их
    // Возвращает результат
    modify: function (data) {
        return data;
    },

    // Вносит изменения в диаграмму, триггерит событие
    extend: function (destination, source) {}
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
        this.listenTo(this.model, 'vm:change', this.draw);
        /*this.listenTo(this.model, 'vm:clear');
        this.listenTo(this.model, 'vm:change');
        this.listenTo(this.model, 'vm:redraw');*/
    },

    handleClick: function (e) {
        var off = this.$el.offset(),
            x = e.pageX - off.left,
            y = e.pageY - off.top;

        e.stopPropagation();

        x = this.getPosition(x);
        y = this.getPosition(y);

        if (this.isValid(x, y)) {
            x = Math.round(x);
            y = Math.round(y);

            this.model.add(new token(x, y));
        }
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
        ab: function (state, coords) {
            var ps = state.get('ps'),
                unit = state.get('unit'),
                delta = Math.round(unit / 4);

            this.apply('beginPath')
                .prop({ fillStyle: '#000' });

            for (var lgth = coords.length, i = 0; i < lgth; i++) {
                this.fillRect({
                        x0: ps[coords[i].x] - delta,
                        y0: ps[coords[i].y] - delta,
                        w: 1 + delta * 2,
                        h: 1 + delta * 2
                    });
            }
        },

        aw: function (state, coords) {
            var ps = state.get('ps'),
                unit = state.get('unit'),
                delta = Math.round(unit / 4);

            this.apply('beginPath')
                .prop({ fillStyle: '#fff' });

            for (var lgth = coords.length, i = 0; i < lgth; i++) {
                this.fillRect({
                        x0: ps[coords[i].x] - delta,
                        y0: ps[coords[i].y] - delta,
                        w: 1 + delta * 2,
                        h: 1 + delta * 2
                    });
            }
        },

        b: function (state, coords) {
            var ps = state.get('ps'),
                unit = state.get('unit'),
                delta = Math.round(unit / 4);

            this.apply('beginPath')
                .prop({ fillStyle: '#000' })
                .fillRect({
                    x0: ps[coords.x] - delta,
                    y0: ps[coords.y] - delta,
                    w: 1 + delta * 2,
                    h: 1 + delta * 2
                });
        },

        w: function (state, coords) {
            var ps = state.get('ps'),
                unit = state.get('unit'),
                delta = Math.round(unit / 4);

            this.apply('beginPath')
                .prop({ fillStyle: '#fff' })
                .fillRect({
                    x0: ps[coords.x] - delta,
                    y0: ps[coords.y] - delta,
                    w: 1 + delta * 2,
                    h: 1 + delta * 2
                });
        },

        goban: function (state) {
            var colors = state.get('colors'),
                ps = state.get('ps'),
                lgth = state.get('lgth'),
                unit = state.get('unit'),
                frame = state.get('frame');

            // Фон
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
        if (attr === 'goban') {
            var layer = this.layer('goban'),
                method = this.figures['goban'];

            method.call(layer, this.model);
        } else {
            var layer,
                method,
                keys = {
                    a: 'stones',
                    b: 'stones',
                    ab: 'stones',
                    aw: 'stones'
                };

            _.each(attr, function (v, k) {
                if (k in this.figures) {
                    if (_.isArray(v)) {
                        for (var lgth = v.length, i = 0; i < lgth; i++) {
                            if (v[i] instanceof token) continue;

                            v[i] = new token(v[i]);
                        }
                    } else {
                        if (!(v instanceof token)) {
                            v = new token(v);
                        }
                    }

                    layer = this.layer(keys[k] || 'marking');
                    method = this.figures[k];
                    method.call(layer, this.model, v);
                }
            }, this);
        }
    },

    isValid: function () {
        for (var lgth = arguments.length, i = 0; i < lgth; i++) {
            if (Math.abs(Math.round(arguments[i]) - arguments[i]) > .4) {
                return false;
            }
        }

        return true;
    },

    getPosition: function (x) {
        x = (x - this.model.get('frame')) / this.model.get('unit');

        if (x > -1 && x < 19) {
            return x;
        } else {
            return null;
        }
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
        this.draw('goban');

        this.addLayer('stones');
        this.addLayer('marking');
        this.draw(this.model.get('scheme'));

        this.$el
            .empty()
            .append(
                this.layer('goban').el,
                this.layer('stones').el,
                this.layer('marking').el
            );
    }
});
