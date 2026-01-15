import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,
    DefaultLogger,
    LogLevel,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { BullMQJobQueuePlugin } from "@vendure/job-queue-plugin/package/bullmq";
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { CmsPlugin } from './plugins/cms/cms.plugin';


const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 8000;

export const config: VendureConfig = {
      logger: new DefaultLogger({ level: LogLevel.Debug }),
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        // trustProxy: 'loopback',
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: 
    // process.env.DATABASE_URL ? 
    {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            synchronize: true,
            migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
            logging: true,
            // ssl: {
            //     rejectUnauthorized: false,
            // },
        },
        // : {
        //     type: 'better-sqlite3',
        //     // See the README.md "Migrations" section for an explanation of
        //     // the `synchronize` and `migrations` options.
        //     synchronize: true,
        //     migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        //     logging: true,
        //     database: path.join(__dirname, '../vendure.sqlite'),
        // },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {},
    plugins: [
        GraphiqlPlugin.init(),
      AssetServerPlugin.init({
        route: "assets",
        assetUploadDir: path.join(__dirname, "../static/assets"),
        assetUrlPrefix: process.env.ASSET_URL_PREFIX || "/assets/",
      }),
        DefaultSchedulerPlugin.init({}),
      BullMQJobQueuePlugin.init({
        connection: {
          host: process.env.REDIS_HOST || "localhost",
          port: +(process.env.REDIS_PORT || 6379),
          maxRetriesPerRequest: null,
        },
      }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation.
                // Here we are assuming a storefront running at http://localhost:8080.
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
        }),
            CmsPlugin.init({
      sanityApiKey: process.env.SANITY_API_KEY,
      sanityProjectId: process.env.SANITY_PROJECT_ID,
      sanityDataset: process.env.SANITY_DATASET || 'production',
      sanityOrigin: process.env.SANITY_ORIGIN,
    }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
        }),
    ],
};
