import mongoose from 'mongoose';

const categoryKeySchema = new mongoose.Schema(
	{
		categoryname: { type: String, required: true },
		key: {
			type: String,
			required: true,
			enum: [
				'md-del-9281',
				'md-mum-3745',
				'md-kol-5619',
				'md-hyd-8120',
				'shr-2318',
				'4min-4932',
				'ggn-7801',
				'kly-6663',
				'fbd-1577',
				'dsw-4492',
				'gzb-6208',
				'gli-3094',
				'md-9281',
			],
		},
	},
	{ timestamps: true }
);

export default mongoose.models.CategoryKeys ||
	mongoose.model('CategoryKeys', categoryKeySchema);
