var Canvas = Backbone.View.extend({

    tagName: 'canvas',

    initialize: function () {
        this._cache = {};
    },

    ctx: function () {
        if (!('ctx' in this._cache)) {
            this._cache['ctx'] = this.el.getContext('2d');
        }

        return this._cache['ctx'];
    },

    size: function (size) {
        this.el.setAttribute('width', size.w);
        this.el.setAttribute('height', size.h);

        return this;
    },

    prop: function (param, value) {
        var attributes = [
                'globalAlpha',
                'globalCompositeOperation',

                'lineWidth',
                'lineCap',
                'lineJoin',
                'miterLimit',

                'strokeStyle',
                'fillStyle',
                'shadowOffsetX',
                'shadowOffsetY',
                'shadowBlur',
                'shadowColor',

                'font',
                'textAlign',
                'textBaseline'
            ];

        var ctx = this.ctx();

        if (typeof param === 'string' && attributes.indexOf(param) > -1) {
            if (value !== undefined) {
                ctx[param] = value;
            } else {
                return ctx[param];
            }
        }

        if (param && param instanceof Object) {
            attributes.forEach(function (attr) {
                if (attr in param) {
                    ctx[attr] = param[attr];
                }
            });
        }

        return this;
    },

    apply: function (method) {
        var ctx = this.ctx();

        ctx[method]();

        return this;
    },

    linearGradient: function (param) {
        var ctx = this.ctx();

        return ctx.createLinearGradient(param.x0, param.y0, param.x1, param.y1);
    },

    radialGradient: function (param) {
        var ctx = this.ctx();

        return ctx.createRadialGradient(param.x0, param.y0, param.r0, param.x1, param.y1, param.r1);
    },

    addColorStop: function (src, param) {
        _.each(param, function (v, k) {
            this.addColorStop(k, v);
        }, src);

        return src;
    },

    arc: function (param) {
        var ctx = this.ctx();

        ctx.arc(param.x0, param.y0, r0, a0, a1);

        return this;
    },

    arcTo: function (param) {
        var ctx = this.ctx();

        ctx.arc(param.x0, param.y0, param.x1, param.y1, r0);

        return this;
    },

    line: function (param) {
        var ctx = this.ctx();

        ctx.moveTo(param.x0, param.y0);
        ctx.lineTo(param.x1, param.y1);

        return this;
    },

    rect: function (param) {
        var ctx = this.ctx();

        ctx.rect(param.x0, param.y0, param.w, param.h);

        return this;
    },

    fillRect: function (param) {
        var ctx = this.ctx();

        ctx.fillRect(param.x0, param.y0, param.w, param.h);

        return this;
    },

    fillText: function (param) {
        var ctx = this.ctx();

        // param.mw
        ctx.fillText(param.t, param.x0, param.y0);

        return this;
    }
});
