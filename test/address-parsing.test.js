const { describe, it } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
const NodeS7 = require('../nodeS7');
const { stringToS7Addr } = NodeS7._internal;

const defaultCParam = {};

describe('stringToS7Addr - Valid DB addresses', function() {
	it('should parse DB1,REAL0', function() {
		const item = stringToS7Addr('DB1,REAL0', 'DB1,REAL0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'DB');
		assert.strictEqual(item.datatype, 'REAL');
		assert.strictEqual(item.dbNumber, 1);
		assert.strictEqual(item.offset, 0);
		assert.strictEqual(item.byteLength, 4);
		assert.strictEqual(item.arrayLength, 1);
	});

	it('should parse DB10,INT6.2 (array of 2)', function() {
		const item = stringToS7Addr('DB10,INT6.2', 'DB10,INT6.2', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'DB');
		assert.strictEqual(item.datatype, 'INT');
		assert.strictEqual(item.dbNumber, 10);
		assert.strictEqual(item.offset, 6);
		assert.strictEqual(item.arrayLength, 2);
		assert.strictEqual(item.byteLength, 4);
	});

	it('should parse DB1,X14.0 (single bit)', function() {
		const item = stringToS7Addr('DB1,X14.0', 'DB1,X14.0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'DB');
		assert.strictEqual(item.datatype, 'X');
		assert.strictEqual(item.dbNumber, 1);
		assert.strictEqual(item.offset, 14);
		assert.strictEqual(item.bitOffset, 0);
		assert.strictEqual(item.arrayLength, 1);
	});

	it('should parse DB10,S20.30 (string at offset 20, length 30)', function() {
		// DB10,S20.30 = DB10, String type, offset 20, string length 30
		// When parsed: splitString2 = ['S20', '30'], datatype='S'
		// For 2-element split with S type: dtypelen = parseInt('30') is NOT correct
		// Actually: splitString[1]='S20.30', split('.') = ['S20','30']
		// datatype = 'S20'.replace(/[0-9]/gi,'') = 'S'
		// S type + 2 elements: dtypelen = parseInt('20',10) + 2 = 22, arrayLength = NOT set here
		// Wait: splitString2.length is 2, so it goes to the (S/STRING && length===2) branch
		// dtypelen = parseInt(splitString2[1], 10) + 2 = parseInt('30') + 2 = 32
		const item = stringToS7Addr('DB10,S20.30', 'DB10,S20.30', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'DB');
		assert.ok(item.datatype === 'S' || item.datatype === 'STRING');
		assert.strictEqual(item.dbNumber, 10);
		assert.strictEqual(item.offset, 20);
		assert.strictEqual(item.dtypelen, 32); // 30 + 2 header
		assert.strictEqual(item.arrayLength, 1);
	});

	it('should parse DB1,DWORD0', function() {
		const item = stringToS7Addr('DB1,DWORD0', 'DB1,DWORD0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.datatype, 'DWORD');
		assert.strictEqual(item.byteLength, 4);
	});

	it('should parse DB1,LREAL0', function() {
		const item = stringToS7Addr('DB1,LREAL0', 'DB1,LREAL0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.datatype, 'LREAL');
		assert.strictEqual(item.byteLength, 8);
	});

	it('should parse DB1,DT0', function() {
		const item = stringToS7Addr('DB1,DT0', 'DB1,DT0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.datatype, 'DT');
		assert.strictEqual(item.byteLength, 8);
	});

	it('should parse DB1,DTL0', function() {
		const item = stringToS7Addr('DB1,DTL0', 'DB1,DTL0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.datatype, 'DTL');
		assert.strictEqual(item.byteLength, 12);
	});
});

describe('stringToS7Addr - Valid non-DB addresses', function() {
	it('should parse MR4 (marker real)', function() {
		const item = stringToS7Addr('MR4', 'MR4', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'M');
		assert.strictEqual(item.datatype, 'REAL');
		assert.strictEqual(item.offset, 4);
		assert.strictEqual(item.dbNumber, 0);
	});

	it('should parse M32.2 (marker bit)', function() {
		const item = stringToS7Addr('M32.2', 'M32.2', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'M');
		assert.strictEqual(item.datatype, 'X');
		assert.strictEqual(item.offset, 32);
		assert.strictEqual(item.bitOffset, 2);
	});

	it('should parse PIW30 (peripheral input word)', function() {
		const item = stringToS7Addr('PIW30', 'PIW30', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'P');
		assert.strictEqual(item.datatype, 'WORD');
		assert.strictEqual(item.offset, 30);
	});

	it('should parse T5 (timer)', function() {
		const item = stringToS7Addr('T5', 'T5', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'T');
		assert.strictEqual(item.datatype, 'TIMER');
		assert.strictEqual(item.offset, 5);
	});

	it('should parse C10 (counter)', function() {
		const item = stringToS7Addr('C10', 'C10', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'C');
		assert.strictEqual(item.datatype, 'COUNTER');
		assert.strictEqual(item.offset, 10);
	});

	it('should parse I0.0 (input bit)', function() {
		const item = stringToS7Addr('I0.0', 'I0.0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'I');
		assert.strictEqual(item.datatype, 'X');
		assert.strictEqual(item.offset, 0);
		assert.strictEqual(item.bitOffset, 0);
	});

	it('should parse Q0.0 (output bit)', function() {
		const item = stringToS7Addr('Q0.0', 'Q0.0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'Q');
		assert.strictEqual(item.datatype, 'X');
	});

	it('should parse EB0 (input byte)', function() {
		const item = stringToS7Addr('EB0', 'EB0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.addrtype, 'I');
		assert.strictEqual(item.datatype, 'BYTE');
	});
});

describe('stringToS7Addr - Invalid addresses', function() {
	it('should reject empty string', function() {
		const item = stringToS7Addr('', '', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject _COMMERR', function() {
		const item = stringToS7Addr('DB1,REAL0', '_COMMERR', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject DB without number', function() {
		const item = stringToS7Addr('DB,REAL0', 'DB,REAL0', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject DB with out-of-range number', function() {
		const item = stringToS7Addr('DB99999,REAL0', 'DB99999,REAL0', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject DB0 (DB number must be >= 1)', function() {
		const item = stringToS7Addr('DB0,REAL0', 'DB0,REAL0', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject bit offset > 7', function() {
		const item = stringToS7Addr('DB1,X14.8', 'DB1,X14.8', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject negative array length', function() {
		const item = stringToS7Addr('DB1,INT0.-1', 'DB1,INT0.-1', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject zero array length', function() {
		const item = stringToS7Addr('DB1,INT0.0', 'DB1,INT0.0', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject unknown memory area', function() {
		const item = stringToS7Addr('Z100', 'Z100', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject non-string input', function() {
		const item = stringToS7Addr(123, 'test', defaultCParam);
		assert.strictEqual(item, undefined);
	});

	it('should reject too many commas', function() {
		const item = stringToS7Addr('DB1,REAL0,extra', 'DB1,REAL0,extra', defaultCParam);
		assert.strictEqual(item, undefined);
	});
});

describe('stringToS7Addr - Edge cases', function() {
	it('should handle max valid DB number (65535)', function() {
		const item = stringToS7Addr('DB65535,REAL0', 'DB65535,REAL0', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.dbNumber, 65535);
	});

	it('should handle large offset', function() {
		const item = stringToS7Addr('DB1,REAL65534', 'DB1,REAL65534', defaultCParam);
		assert.ok(item);
		assert.strictEqual(item.offset, 65534);
	});

	it('should handle WDT datatype with wdtAsUTC=true', function() {
		const item = stringToS7Addr('DB1,WDT0', 'DB1,WDT0', { wdtAsUTC: true });
		assert.ok(item);
		assert.strictEqual(item.datatype, 'DTZ');
	});

	it('should handle WDT datatype with wdtAsUTC=false', function() {
		const item = stringToS7Addr('DB1,WDT0', 'DB1,WDT0', { wdtAsUTC: false });
		assert.ok(item);
		assert.strictEqual(item.datatype, 'DT');
	});
});
