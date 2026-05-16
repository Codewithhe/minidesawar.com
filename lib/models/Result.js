import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
	{
		categoryname: { type: String, required: true },
		date: { type: String, required: true },
		result: { type: Array, required: true },
		number: { type: Number, required: true },
		next_result: { type: String, required: true },
		mode: { type: String },
		key: { type: String },
	},
	{ timestamps: true }
);

export default mongoose.models.Result || mongoose.model('Result', resultSchema);
