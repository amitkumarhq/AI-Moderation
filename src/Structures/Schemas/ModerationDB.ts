import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export default model(
    'ModerationDB', new Schema({
        GuildID: String,
        UserID: String,
        ChannelIDs: Array,
        WarnData: Array,
        KickData: Array,
        BanData: Array,

        // AI Moderation System
        Punishments: Array,
        LogChannelIDs: Array,
        BypassUsers: Array,
        BypassRoles: Array,

    })

);
