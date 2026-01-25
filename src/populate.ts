import { populate } from '@vendure/core/cli';
import { bootstrap, VendureConfig } from '@vendure/core';
import { createConnection } from 'typeorm';
import path from 'path';

/**
 * @description
 * This function is responsible for populating the DB with test data on the first run. It
 * first checks to see if the configured DB has any tables, and if not, runs the `populate()`
 * function using data from the @vendure/create package.
 */
export async function populateOnFirstRun(config: VendureConfig) {

        return populate(
            () => bootstrap({
                ...config,
                importExportOptions: {
                    importAssetsDir: path.join(
                        require.resolve('@vendure/create/assets/products.csv'),
                        '../images'
                    ),
                },
                dbConnectionOptions: {...config.dbConnectionOptions, synchronize: true}
            }),
            require('@vendure/create/assets/initial-data.json'),
            require.resolve('@vendure/create/assets/products.csv')
        );
    } 
 