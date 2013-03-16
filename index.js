var symbolFor = {},
    codeFor   = {};

exports.init = function (symbols) {
    var frequency = calculateFrequency(symbols),
        nodes = [],
        combined;

    Object.keys(frequency).forEach(function (symbol) {
        nodes.push({
            type: 'leaf',
            symbol: symbol,
            weight: frequency[symbol]
        });
    });

    nodes.sort(sortNodes);

    while (nodes.length > 1) {
        combined = combineNodes(nodes.pop(), nodes.pop());
        nodes.push(combined);
        nodes.sort(sortNodes);
    }

    encodeSymbol(node, []);
};

var encode = exports.encode = function (symbols) {
    var code = '',
        symbol, len, i;

    for (i = 0, len = symbols.length; i < len; i += 1) {
        symbol = symbols[i];
        if (symbol != '') {
            code += codeFor[symbol];
        }
    }

    return code;
};

exports.hexEncode = function (symbols) {
    var binary = encode(symbols),
        hex = '',
        chunk, len, i;

    for (i = 0, len = binary.length; i < len; i += 4) {
        chunk = binary.substr(i, 4);
        if (chunk.length === 4) {
            hex += parseInt(chunk, 2).toString(16);
        }
    }

    return {
        hex: hex,
        remainder: chunk
    };
};

var decode = exports.decode = function (binary) {
    var symbols = [],
        code = '',
        symbol, len, i;

    for (i = 0, len = binary.length; i < len; i += 1) {
        code += binary[i];
        symbol = symbolFor[code];
        if (symbol) {
            symbols.push(symbol);
            code = '';
        }
    }

    return symbols;
};

exports.hexDecode = function (hex) {
    var symbols = [],
        binary, b, len, i;

    for (i = 0, len = hex.length; i < len; i += 1) {
        b = parseInt(hex.substr(i, 1), 16).toString(2);
        if (b.length !== 4) {
            b = zeros(4 - binary.length) + b;
        }
        binary += b;
    }

    return decode(binary);
};

function zeros (count) {
    var output = '';
    while (count--) {
        output += '0';
    }
    return output;
}

function encodeSymbol (node, bits) {
    if (node.leaf) {
        node.code = bits.join('');

        // Caching is good.
        codeFor[node.symbol] = node.code;
        symbolFor[node.code] = node.symbol;

        return;
    }

    bits.push(0);
    encodeSymbol(node.left, bits);
    bits.pop();

    bits.push(1);
    encodeSymbol(node.right, bits);
    bits.pop();
}

// Low weights at the end.
function sortNodes (a, b) {
    return b.weight - a.weight;
}

function combineNodes (a, b) {
    return {
        left: a,
        right: b,
        weight: a.weight + b.weight
    };
}

function calculateFrequency (symbols) {
    var frequency = {};
    symbols.forEach(function (symbol) {
        if (symbol !== '') {
            frequency[symbol] = frequency[symbol] || 0;
            frequency[symbol] += 1;
        }
    });
    return frequency;
}
