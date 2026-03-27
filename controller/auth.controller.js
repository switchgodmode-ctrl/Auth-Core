import "../module/connection.js";


import ApplicationSchemaModule from "../module/application.module.js";

import LicenceSchemaModule from "../module/licence.module.js";

import { compositeHwid } from "../utils/hwid.js";

export const verifyLicence = async (req, res) => {
    try {

        const { appName, appSecret, licenceKey, hwid, app_id, app_version, app_secret, license_key } = req.body;


        const useV2 = !!app_id || !!app_secret || !!license_key;

        const nameOrIdProvided = useV2 ? (app_id && app_secret && license_key && hwid) : (appName && appSecret && licenceKey && hwid);

        if (!nameOrIdProvided) {
            return res.status(400).json({
                status: false,
                message: "Missing required fields"
            });
        }

        const signals = {
            system_uuid: req.body.system_uuid,
            motherboard_id: req.body.motherboard_id
        };

        const serverComposite = compositeHwid(signals);

        let app;
        if (useV2) {

            app = await ApplicationSchemaModule.findOne({ _id: Number(app_id) });
        } else {

            app = await ApplicationSchemaModule.findOne({ appName });
        }

        if (!app)
            return res.status(404).json({
                status: false,
                message: "Application not found"
            });

        const providedSecret = useV2 ? app_secret : appSecret;
        if (app.appSecret !== providedSecret)
            return res.status(401).json({
                status: false,
                message: "Invalid app secret"
            });

        if (useV2 && app_version && String(app.version) !== String(app_version)) {
            return res.status(409).json({
                status: false,
                message: "App version mismatch"
            });
        }

        const keyToCheck = useV2 ? license_key : licenceKey;

        const licence = await LicenceSchemaModule.findOne({ key: keyToCheck, appId: app._id });

        if (!licence)
            return res.status(403).json({
                status: false,
                message: "Licence not valid for this application"
            });

        if (licence.Status === "ban")
            return res.status(403).json({
                status: false,
                message: "Licence is banned"
            });

        if (licence.activatedAt) {
            const expiryDate = new Date(licence.activatedAt);
            expiryDate.setDate(expiryDate.getDate() + licence.Day);

            if (new Date() > expiryDate) {

                await LicenceSchemaModule.updateOne(
                    { _id: licence._id },
                    { $set: { Status: "offline" } }
                );

                return res.status(403).json({
                    status: false,
                    message: "Licence expired"
                });
            }
        } else {

            await LicenceSchemaModule.updateOne(
                { _id: licence._id },
                { $set: { activatedAt: new Date(), hwid, hwidSignals: signals } }
            );
        }

        if (licence.hwid && licence.hwid !== hwid) {
            return res.status(403).json({
                status: false,
                message: "HWID mismatch"
            });
        }

        if (signals.motherboard_id || signals.system_uuid) {
            if (serverComposite && serverComposite !== hwid) {
                return res.status(403).json({
                    status: false,
                    message: "HWID hash mismatch"
                });
            }
        }

        await LicenceSchemaModule.updateOne(
            { _id: licence._id },
            { $set: { Status: "online" } }
        );

        res.status(200).json({
            status: true,
            message: "Licence verified successfully",
            application: {
                id: app._id,
                name: app.appName,
                version: app.version
            },
            licence: {
                key: licence.key,
                status: "online",
                validDays: licence.Day,
                hwid
            }
        });

    } catch (error) {

        res.status(500).json({
            status: false,
            error: error.message
        });
    }
};

export const offlineLicence = async (req, res) => {
    try {

        const { key } = req.body;

        if (!key)
            return res.status(400).json({
                status: false,
                message: "Licence key required"
            });


        const result = await LicenceSchemaModule.updateOne(
            { key },
            { $set: { Status: "offline" } }
        );

        if (result.modifiedCount > 0)
            res.status(200).json({
                status: true,
                message: "Licence set to offline"
            });
        else
            res.status(404).json({
                status: false,
                message: "Licence not found"
            });

    } catch (error) {

        res.status(500).json({
            status: false,
            error: error.message
        });
    }
};
