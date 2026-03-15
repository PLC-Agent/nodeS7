const { describe, it } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
const NodeS7 = require('../nodeS7');
const { S7AddrToBuffer, stringToS7Addr, safeParseInt, S7Error } = NodeS7._internal;

const defaultCParam = {};

describe('safeParseInt - Input validation helper', function() {
	it('should parse valid integer within range', function() {
		assert.strictEqual(safeParseInt('42', 0, 100), 42);
	});

	it('should return undefined for NaN input', function() {
		assert.strictEqual(safeParseInt('abc', 0, 100), undefined);
	});

	it('should return undefined for empty string', function() {
		assert.strictEqual(safeParseInt('', 0, 100), undefined);
	});

	it('should return undefined for value below min', function() {
		assert.strictEqual(safeParseInt('5', 10, 100), undefined);
	});

	it('should return undefined for value above max', function() {
		assert.strictEqual(safeParseInt('200', 0, 100), undefined);
	});

	it('should accept boundary values', function() {
		assert.strictEqual(safeParseInt('0', 0, 100), 0);
		assert.strictEqual(safeParseInt('100', 0, 100), 100);
	});

	it('should handle negative min values', function() {
		assert.strictEqual(safeParseInt('-5', -10, 10), -5);
	});
});

describe('S7AddrToBuffer - Address to buffer conversion', function() {
	it('should create valid buffer for DB REAL address', function() {
		const item = stringToS7Addr('DB1,REAL0', 'DB1,REAL0', defaultCParam);
		assert.ok(item);
		const buf = S7AddrToBuffer(item, false);
		assert.ok(Buffer.isBuffer(buf));
		assert.strictEqual(buf.length, 12);
		// Check area code (byte 8 high nibble should contain 0x84 for DB)
		assert.strictEqual(buf[8] & 0xFF, 0x84);
	});

	it('should create valid buffer for marker address', function() {
		const item = stringToS7Addr('MW0', 'MW0', defaultCParam);
		assert.ok(item);
		const buf = S7AddrToBuffer(item, false);
		assert.ok(Buffer.isBuffer(buf));
		assert.strictEqual(buf[8] & 0xFF, 0x83); // Marker area code
	});

	it('should handle bit addressing for single bit write', function() {
		const item = stringToS7Addr('DB1,X0.3', 'DB1,X0.3', defaultCParam);
		assert.ok(item);
		const buf = S7AddrToBuffer(item, true); // isWriting = true
		assert.strictEqual(buf[3], 0x01); // BIT length for single bit write
	});

	it('should handle timer area code', function() {
		const item = stringToS7Addr('T5', 'T5', defaultCParam);
		assert.ok(item);
		const buf = S7AddrToBuffer(item, false);
		assert.strictEqual(buf[8] & 0xFF, 0x1d); // Timer area code
	});

	it('should handle counter area code', function() {
		const item = stringToS7Addr('C10', 'C10', defaultCParam);
		assert.ok(item);
		const buf = S7AddrToBuffer(item, false);
		assert.strictEqual(buf[8] & 0xFF, 0x1c); // Counter area code
	});
});

describe('S7Error - Error code constants', function() {
	it('should have all expected error codes', function() {
		assert.ok(S7Error.TIMEOUT);
		assert.ok(S7Error.INVALID_ADDRESS);
		assert.ok(S7Error.BUFFER_OVERFLOW);
		assert.ok(S7Error.PACKET_MALFORMED);
		assert.ok(S7Error.CONNECTION_REFUSED);
		assert.ok(S7Error.NOT_CONNECTED);
		assert.ok(S7Error.WRITE_IN_PROGRESS);
		assert.ok(S7Error.PLC_ERROR);
		assert.ok(S7Error.INVALID_ARGUMENT);
	});

	it('should be accessible from NodeS7.errors', function() {
		assert.strictEqual(NodeS7.errors, S7Error);
		assert.strictEqual(NodeS7.errors.TIMEOUT, 'ERR_S7_TIMEOUT');
	});
});

describe('NodeS7 constructor', function() {
	it('should create instance with default options', function() {
		const conn = new NodeS7({ silent: true });
		assert.ok(conn);
		assert.strictEqual(conn.isoConnectionState, 0);
		assert.strictEqual(conn.reconnectCount, 0);
		assert.strictEqual(conn.maxReconnectAttempts, Infinity);
		assert.strictEqual(conn.baseReconnectDelay, 2000);
	});

	it('should inherit from EventEmitter', function() {
		const conn = new NodeS7({ silent: true });
		assert.ok(typeof conn.on === 'function');
		assert.ok(typeof conn.emit === 'function');
		assert.ok(typeof conn.removeListener === 'function');
	});

	it('should have Promise API methods', function() {
		const conn = new NodeS7({ silent: true });
		assert.ok(typeof conn.initiateConnectionAsync === 'function');
		assert.ok(typeof conn.readAllItemsAsync === 'function');
		assert.ok(typeof conn.writeItemsAsync === 'function');
		assert.ok(typeof conn.dropConnectionAsync === 'function');
	});
});
