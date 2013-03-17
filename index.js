var symbolFor = exports.symbolFor = {},
    codeFor   = exports.codeFor   = {},
    tree      = exports.tree;

/**
Initialize using either an array of symbols that should be converted into a
Huffman tree, or an existing Huffman tree with non-leaf nodes with `left`, and
`right` properties, and leaf nodes with `symbol`, and `code` properties.

@method initialize
@param {Array|Object} Either an array of symbols or a Huffman tree
**/
exports.initialize = function (o) {
    if (Array.isArray(o)) {
        exports.tree = generate(o);
    }
    else if (typeof o === 'object' && o !== null) {
        exports.tree = o;
        encodeSymbol(o);
    }
};

/**
Generates a Huffman tree given an array of symbols.

@method generate
@param symbols {Array} A statistically-relevant set of symbols
@return {Object} A tree
**/
var generate = exports.generate = function (symbols) {
    var frequency = calculateFrequency(symbols),
        nodes = [],
        combined;

    Object.keys(frequency).forEach(function (symbol) {
        nodes.push({
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

    return encodeSymbol(nodes[0], []);
};

/**
Encodes symbols into binary.

@method encode
@param symbols {Array} Symbols to encode
@return {String} Binary encoding
**/
var encode = exports.encode = function (symbols) {
    if (codeFor) {
        var code = '',
            symbol, len, i;

        for (i = 0, len = symbols.length; i < len; i += 1) {
            symbol = symbols[i];
            if (symbol != '') {
                code += codeFor[symbol];
            }
        }

        return code;
    }
};

/**
Encodes symbols into hex.

Note: Since it's not clear what should be done with any left-over bits, return
an object with `hex` and `binary` properties.

@method encodeHex
@param symbols {Array} Symbols to encode
@return {Object} Hex encoding and binary left-over
**/
exports.encodeHex = function (symbols) {
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
        binary: chunk
    };
};

/**
Decodes binary into symbols.

@method decode
@param symbols {String} Binary to decode
@return {Array} Decoded symbols
**/
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

    if (code) {
        console.error('Failed to decode due to left-over bits: ' + code);
        throw new Error('Failed to decode.');
    }

    return symbols;
};

/**
Decodes hex into symbols.

Note: Pass any extra bits as `o.binary` that need to be appended to the binary
before decoding.

@method decodeHex
@param symbols {Array} Symbols to encode
@return {Object} Hex encoding and binary left-over
**/
exports.decodeHex = function (o) {
    var hex = o.hex,
        symbols = [],
        binary = '',
        b, len, i;

    for (i = 0, len = hex.length; i < len; i += 1) {
        b = parseInt(hex.substr(i, 1), 16).toString(2);
        if (b.length !== 4) {
            b = zeros(4 - b.length) + b;
        }
        binary += b;
    }

    return decode(binary + (o.binary || ''));
};

/**
Convenience method used to generate a string of zeros.

@method zeros
@param count {Integer}
@return {String}
**/
function zeros (count) {
    var output = '';
    while (count--) {
        output += '0';
    }
    return output;
}

// -- Functions used to generate a Huffman tree ------------------------------

/**
Recursively traverses a Huffman tree and optionally generates a variable-length
prefix code for each symbol. Caches mappings between codes and symbols, and
symbols and codes.

The optional `bits` param should be left out if all we want to do is to
initialize using an existing Huffman tree.

@method encodeSymbol
@param node {Object} Tree node
@param bits {Array} The currently traversed path (`0` for left child, and `1` for
    right child)
@return {Object} The encoded tree
**/
function encodeSymbol (node, bits) {
    if (node.symbol) {
        if (bits) {
            node.code = bits.join('');
        }

        // Caching is good.
        codeFor[node.symbol] = node.code;
        symbolFor[node.code] = node.symbol;

        return;
    }

    bits && bits.push(0);
    encodeSymbol(node.left, bits);
    bits && bits.pop();

    bits && bits.push(1);
    encodeSymbol(node.right, bits);
    bits && bits.pop();

    return node;
}

/**
Sorts an array of nodes such that the nodes with lower weights end up at the
tail of the list.

@method sortNodes
@param a {Object} Tree node
@param b {Object} Tree node
**/
function sortNodes (a, b) {
    return b.weight - a.weight;
}

/**
Used to combine nodes while building the Huffman tree.

@method combineNodes
@param a {Object} Tree node
@param b {Object} Tree node
@return {Object} Tree node
**/
function combineNodes (a, b) {
    return {
        left: a,
        right: b,
        weight: a.weight + b.weight
    };
}

/**
Given an array of symbols that represents a statictically-relevant sample of
what needs to be encoded, this simple method will keep track of the frequency
that each symbol appears.

TODO: Use streams to support large inputs.

@method calculateFrequency
@param {Array} symbols An array of symbols
@return {Object} A frequency map
**/
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
