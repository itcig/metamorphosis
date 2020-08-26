import avro from 'avsc';

export default avro.types.LongType.__with({
	fromBuffer: (buf: { readBigInt64LE: () => any }) => buf.readBigInt64LE(),
	toBuffer: (n: bigint) => {
		const buf = Buffer.alloc(8);
		buf.writeBigInt64LE(n);
		return buf;
	},
	fromJSON: BigInt,
	toJSON: Number,
	isValid: (n: any) => typeof n == 'bigint',
	compare: (n1: bigint, n2: bigint) => {
		return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
	},
});
