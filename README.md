# Huffman Coding

Needs more performance enhancements to use streaming.

## Exports

### init

Initializes a Huffman tree, given an array of all the symbols that need to be
encoded.

### encode

Takes a list of symbols and uses the Huffman tree that it was initialized with
to output a binary string encoding.

### decode

Takes a binary string and uses the Huffman tree that it was initialized with,
to decode an array of symbols.

### hexEncode

Same as `encode` but outputs a hex string.

### hexDecode

Same as `decode` but takes a hex string and outputs an array of symbols.
