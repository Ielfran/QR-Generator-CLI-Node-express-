const qrcode =require('qrcode');
const Joi = require('joi');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const redis = require('../utils/cache');

const qrScheme = Joi.object({
    data: Joi.string()
        .required()
        .max(2953)
        .error(new Error('Data is required and must be less than 2953 characters')),
    size: Joi.number().integer().min(100).max(1000).default(200),
    margin: Joi.number().integer().min(0).max(10).default(1),
    colorDark: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).default('#000000'),
    colorLight: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
    format: Joi.string().valid('png', 'svg', 'jpeg', 'webp').default('png'),
    errorCorrection: Joi.string().valid('L', 'M', 'Q', 'H').default('M'),
    logo: Joi.string().uri().optional()
});

const generateQrCode = async (req, res, next) => {
    try{
        const {error, value} = qrSchema.validate(req.query);
        if(error) {
            error.statusCode = 400;
            error.errorCode = 'VALIDATION_ERROR';
            throw error;
        }
        const {data, size, margin, colorDark , colorLight, format, errorCorrection , logo} =value;
        const cacheKey = `qr:${JSON.stringify({data, size, margin, colorDark, colorLight, format, errorCorrection })}`;

        const cached = await redis.get(cacheKey);
        if(cached && format !== 'svg') {
            logger.info(`Serving cached QR code for ${cacheKey}`);
            res.set('Content-Type', `image/${format}`);
            return res.send(Buffer.from(cached, 'base64'));
        }

        const qrOptions = {
            width : size,
            margin,
            color : { dark:colorDark, light:colorLight},
            errorCorrectionLevel: errorCorrection
        };

        let output;
        if(format === 'svg'){
            output = await QRCode.toString(data, {...qrOptions, type:'svg' });
            res.set('Content-Type', 'image/svg+xml');
            res.set('Content-Disposition', `attachment; filename = "qrcode.svg"`);
            return res.send(output);
        }else{
            let qrBuffer = await QRCode.toBuffer(data, qrOptions);

            if(logo) {
                try{
                    const logoBuffer = await (await fetch(logo)).arrayBuffer();
                    const logoImage = await sharp(Buffer.from(logoBuffer))
                        .resize(Math.floor(size * 0.2))
                        .toBuffer();
                    qrBuffer = await sharp(qrBuffer)
                        .composite([{ input: logoImage, gravity: 'center' }])
                        .toFormat(format, { quality: format === 'jpeg' || format ==='webp' ? 80 : undefined })
                        .toBuffer();
                }catch(err){
                    logger.warn(`Logo embedding failed: ${err.message}`);
                }
            }else{
                if(format != 'png') {
                    qrBuffer = await sharp(qrBuffer)
                        .toFormat(format, { quality: format ==='jpeg' || format === 'webp' ? 80 : undefined })
                        .toBuffer();
                }
            }

            await redis.setEx(cacheKey, 3600, qrBuffer.toString('base64'));//caching for 1 ghanta
            logger.info(`Generated and cached QR code for ${cacheKey}`);

            const filename = `qrcode-${Date.now()}.${format}`;
            await fs.writeFile(path.join(__dirname, '../uploads', filename), qrBuffer);
            res.set('Content-Type', `image/${format}`);
            res.set('Content-Disposition', `attachment; filename = "${filename}"`);
            res.send(qrBuffer);
        }
    }catch(err){
        err.statusCode = err.statusCode || 500;
        err.errorCode = err.errorCode || 'QR_GENERATION_ERROR';
        next(err);
    }
};

const getQrMetadata = async (req, res, next) => {
    try{
        const maxData = {
            L: 2953,
            M: 2331,
            Q: 1663,
            H: 1273
        };
        res.json({
            success: true,
            maxDataLenght: maxData,
            supportedFormats: ['png', 'svg', 'jpeg', 'webp'],
            supportedErrorCorrection: ['L', 'M', 'Q', 'H']
        });
    }catch(err){
        err.statusCode = 500;
        err.errorCode = 'METADATA_ERROR';
        next(err);
    }
};

module.exports = { generateQrCode, getQrMetadata };
