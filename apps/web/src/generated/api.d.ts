export interface paths {
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/internal/maintenance/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["MaintenanceController_run"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AuthController_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/styles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicCatalogController_listStyles"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/room-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicCatalogController_listRoomTypes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/categories/{categoryId}/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicCatalogController_listCategoryProducts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/products/{productId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicCatalogController_getProduct"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/styles/{styleId}/default-materials": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicCatalogController_getStyleDefaultMaterials"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/engineering": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicCatalogController_getEngineering"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ImagesController_upload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/room-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["RoomTypesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/room-types/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["RoomTypesController_updateName"];
        trace?: never;
    };
    "/api/v1/admin/room-types/{id}/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["RoomTypesController_replaceCategories"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CategoriesController_list"];
        put?: never;
        post: operations["CategoriesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/categories/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["CategoriesController_remove"];
        options?: never;
        head?: never;
        patch: operations["CategoriesController_update"];
        trace?: never;
    };
    "/api/v1/admin/categories/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CategoriesController_updateStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/material-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["MaterialTypesController_list"];
        put?: never;
        post: operations["MaterialTypesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/material-types/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["MaterialTypesController_update"];
        trace?: never;
    };
    "/api/v1/admin/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProductsController_list"];
        put?: never;
        post: operations["ProductsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProductsController_get"];
        put?: never;
        post?: never;
        delete: operations["ProductsController_remove"];
        options?: never;
        head?: never;
        patch: operations["ProductsController_update"];
        trace?: never;
    };
    "/api/v1/admin/products/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ProductsController_changeStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/styles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StylesController_list"];
        put?: never;
        post: operations["StylesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/styles/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StylesController_get"];
        put?: never;
        post?: never;
        delete: operations["StylesController_remove"];
        options?: never;
        head?: never;
        patch: operations["StylesController_update"];
        trace?: never;
    };
    "/api/v1/admin/styles/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["StylesController_reorder"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/styles/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["StylesController_updateStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/styles/{id}/default-materials": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["StylesController_updateDefaultMaterials"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/engineering/package-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EngineeringPackageItemsController_list"];
        put?: never;
        post: operations["EngineeringPackageItemsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/engineering/package-items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["EngineeringPackageItemsController_remove"];
        options?: never;
        head?: never;
        patch: operations["EngineeringPackageItemsController_update"];
        trace?: never;
    };
    "/api/v1/admin/engineering/package-items/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["EngineeringPackageItemsController_updateStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/engineering/package-items/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["EngineeringPackageItemsController_reorder"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OptionsController_list"];
        put?: never;
        post: operations["OptionsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/options/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OptionsController_get"];
        put?: never;
        post?: never;
        delete: operations["OptionsController_remove"];
        options?: never;
        head?: never;
        patch: operations["OptionsController_update"];
        trace?: never;
    };
    "/api/v1/admin/options/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["OptionsController_reorder"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/options/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OptionsController_updateStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/pricing-data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicPricingController_getPricingData"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/estimates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublicPricingController_createEstimate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/pricing/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["RulesController_list"];
        put?: never;
        post: operations["RulesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/pricing/rules/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["RulesController_preview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/pricing/rules/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["RulesController_reorder"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/pricing/rules/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["RulesController_remove"];
        options?: never;
        head?: never;
        patch: operations["RulesController_update"];
        trace?: never;
    };
    "/api/v1/admin/pricing/formulas/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["FormulasController_validate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/pricing/base-rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["BaseRatesController_list"];
        put?: never;
        post: operations["BaseRatesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/pricing/base-rates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["BaseRatesController_remove"];
        options?: never;
        head?: never;
        patch: operations["BaseRatesController_update"];
        trace?: never;
    };
    "/api/v1/admin/pricing/coefficients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CoefficientsController_list"];
        put?: never;
        post: operations["CoefficientsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/pricing/coefficients/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["CoefficientsController_remove"];
        options?: never;
        head?: never;
        patch: operations["CoefficientsController_update"];
        trace?: never;
    };
    "/api/v1/admin/pricing/exchange-rate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ExchangeRateController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/pricing/exchange-rate/manual": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["ExchangeRateController_setManual"];
        post?: never;
        delete: operations["ExchangeRateController_clearManual"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/calculations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublicCalculationsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/calculations/{publicId}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublicCalculationsController_recalculate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/calculations/{publicId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicCalculationsController_getLatest"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/calculations/{publicId}/versions/{number}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicCalculationsController_getVersion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/leads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublicLeadsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/leads/form-settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicLeadsController_formSettings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        HealthResponseDto_Output: {
            /** @constant */
            service: "up";
            /** @enum {string} */
            database: "up" | "down";
        };
        MaintenanceRunResponseDto_Output: {
            tasks: {
                name: string;
                /** @enum {string} */
                status: "SKIPPED_NOT_DUE" | "SUCCESS" | "FAILED";
            }[];
        };
        ErrorResponseDto: {
            error: {
                code: string;
                params?: {
                    [key: string]: unknown;
                };
                fields?: {
                    path: string;
                    code: string;
                    params?: {
                        [key: string]: unknown;
                    };
                }[];
            };
        };
        LoginDto: {
            login: string;
            password: string;
        };
        AdminMeDto_Output: {
            /** Format: uuid */
            id: string;
            login: string;
            isDemo: boolean;
            sandbox: {
                /** Format: date-time */
                nextResetAt: string;
                resetTime: string;
                timezone: string;
            } | null;
            demoLimits: {
                writesPerHour: number;
                uploadsPerHour: number;
            } | null;
        };
        ChangePasswordDto: {
            currentPassword: string;
            newPassword: string;
        };
        PublicStylesResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                name: string;
                description: string;
                image: {
                    /** Format: uuid */
                    id: string;
                    /** Format: uri */
                    thumb: string;
                    /** Format: uri */
                    card: string;
                    /** Format: uri */
                    zoom: string;
                } | null;
            }[];
        };
        PublicRoomTypesResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                /** @enum {string} */
                code: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                name: string;
                categories: {
                    /** Format: uuid */
                    id: string;
                    name: string;
                    /** @enum {string} */
                    surface: "NONE" | "FLOOR" | "WALLS" | "CEILING";
                    wastePercent: number;
                    productCount: number;
                }[];
            }[];
        };
        PublicProductCardsResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                name: string;
                brand: string;
                manufacturer: string;
                size: string;
                color: string;
                priceCents: number;
                /** @enum {string} */
                unit: "SQM" | "LINEAR_M" | "PIECE";
                materialTypeCode: string;
                heatedFloorCompatible: boolean;
                image: {
                    /** Format: uuid */
                    id: string;
                    /** Format: uri */
                    thumb: string;
                    /** Format: uri */
                    card: string;
                    /** Format: uri */
                    zoom: string;
                } | null;
            }[];
        };
        PublicProductDetailsResponseDto_Output: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            categoryId: string;
            name: string;
            description: string;
            brand: string;
            manufacturer: string;
            size: string;
            color: string;
            priceCents: number;
            /** @enum {string} */
            unit: "SQM" | "LINEAR_M" | "PIECE";
            materialTypeCode: string;
            heatedFloorCompatible: boolean;
            wastePercent: number;
            images: {
                /** Format: uuid */
                id: string;
                /** Format: uri */
                thumb: string;
                /** Format: uri */
                card: string;
                /** Format: uri */
                zoom: string;
            }[];
            attributes: {
                name: string;
                value: string;
            }[];
            surface: {
                /** @enum {string} */
                kind: "NONE" | "FLOOR" | "WALLS" | "CEILING";
                texture: {
                    /** Format: uuid */
                    id: string;
                    /** Format: uri */
                    url: string;
                };
                tileWidthMm: number;
                tileLengthMm: number;
                fallbackColor: string;
            } | null;
        };
        PublicDefaultMaterialsResponseDto_Output: {
            /** Format: uuid */
            styleId: string;
            items: {
                /** @enum {string} */
                roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                /** Format: uuid */
                categoryId: string;
                productId: string | null;
            }[];
        };
        PublicEngineeringResponseDto_Output: {
            packageItems: {
                /** Format: uuid */
                id: string;
                name: string;
                description: string;
                includedInBase: boolean;
                priceCents: number | null;
                unit: ("PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT") | null;
            }[];
            options: {
                /** Format: uuid */
                id: string;
                /** @enum {string} */
                kind: "ENGINEERING" | "ADDITIONAL";
                name: string;
                description: string;
                image: {
                    /** Format: uuid */
                    id: string;
                    /** Format: uri */
                    thumb: string;
                    /** Format: uri */
                    card: string;
                    /** Format: uri */
                    zoom: string;
                } | null;
                priceCents: number;
                /** @enum {string} */
                unit: "PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT";
                perRoom: boolean;
                roomTypeCodes: ("LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM")[];
                minQuantity: number | null;
                maxQuantity: number | null;
            }[];
        };
        AdminImageDto_Output: {
            /** Format: uuid */
            id: string;
            /** Format: uri */
            thumb: string;
            /** Format: uri */
            card: string;
            /** Format: uri */
            zoom: string;
            /** Format: uri */
            texture: string;
            width: number;
            height: number;
        };
        RoomTypeAdminListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                /** @enum {string} */
                code: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                name: {
                    en: string;
                    uk: string;
                };
                categories: {
                    /** Format: uuid */
                    id: string;
                    name: {
                        en: string;
                        uk: string;
                    };
                    /** @enum {string} */
                    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                    /** @enum {string} */
                    surface: "NONE" | "FLOOR" | "WALLS" | "CEILING";
                }[];
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
        };
        PatchRoomTypeDto: {
            name: {
                en: string;
                uk: string;
            };
            /** Format: uuid */
            revision: string;
        };
        RoomTypeAdminDto_Output: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            code: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
            name: {
                en: string;
                uk: string;
            };
            categories: {
                /** Format: uuid */
                id: string;
                name: {
                    en: string;
                    uk: string;
                };
                /** @enum {string} */
                status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                /** @enum {string} */
                surface: "NONE" | "FLOOR" | "WALLS" | "CEILING";
            }[];
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        ReplaceRoomTypeCategoriesDto: {
            categoryIds: string[];
            /** Format: uuid */
            revision: string;
        };
        CategoryAdminListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                name: {
                    en: string;
                    uk: string;
                };
                wastePercent: number;
                /** @enum {string} */
                surface: "NONE" | "FLOOR" | "WALLS" | "CEILING";
                /** @enum {string} */
                status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                productCount: number;
                roomTypeCodes: ("LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM")[];
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
        };
        CreateCategoryDto: {
            name: {
                en: string;
                uk: string;
            };
            wastePercent: number;
            /** @enum {string} */
            surface: "NONE" | "FLOOR" | "WALLS" | "CEILING";
        };
        CategoryAdminDto_Output: {
            /** Format: uuid */
            id: string;
            name: {
                en: string;
                uk: string;
            };
            wastePercent: number;
            /** @enum {string} */
            surface: "NONE" | "FLOOR" | "WALLS" | "CEILING";
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            productCount: number;
            roomTypeCodes: ("LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM")[];
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        PatchCategoryDto: {
            name?: {
                en: string;
                uk: string;
            };
            wastePercent?: number;
            /** @enum {string} */
            surface?: "NONE" | "FLOOR" | "WALLS" | "CEILING";
            /** Format: uuid */
            revision: string;
        };
        UpdateCategoryStatusDto: {
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
        };
        MaterialTypeAdminListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                code: string;
                name: {
                    en: string;
                    uk: string;
                };
                /** @enum {string} */
                status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
        };
        CreateMaterialTypeDto: {
            code: string;
            name: {
                en: string;
                uk: string;
            };
        };
        MaterialTypeAdminDto_Output: {
            /** Format: uuid */
            id: string;
            code: string;
            name: {
                en: string;
                uk: string;
            };
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        UpdateMaterialTypeDto: {
            name?: {
                en: string;
                uk: string;
            };
            /** @enum {string} */
            status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
        };
        ProductAdminListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                name: {
                    en: string;
                    uk: string;
                };
                /** Format: uuid */
                categoryId: string;
                /** @enum {string} */
                status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                priceCents: number;
                /** @enum {string} */
                unit: "SQM" | "LINEAR_M" | "PIECE";
                image: {
                    /** Format: uuid */
                    id: string;
                    /** Format: uri */
                    thumb: string;
                    /** Format: uri */
                    card: string;
                    /** Format: uri */
                    zoom: string;
                } | null;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
            page: number;
            pageSize: number;
            total: number;
        };
        ProductAdminDto_Output: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            categoryId: string;
            /** Format: uuid */
            materialTypeId: string;
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            brand: string;
            manufacturer: string;
            color: {
                en: string;
                uk: string;
            };
            size: {
                en: string;
                uk: string;
            };
            priceCents: number;
            /** @enum {string} */
            unit: "SQM" | "LINEAR_M" | "PIECE";
            wastePercentOverride: number | null;
            heatedFloorCompatible: boolean;
            images: {
                /** Format: uuid */
                id: string;
                /** Format: uri */
                thumb: string;
                /** Format: uri */
                card: string;
                /** Format: uri */
                zoom: string;
                isPrimary: boolean;
            }[];
            attributes: {
                name: {
                    en: string;
                    uk: string;
                };
                value: {
                    en: string;
                    uk: string;
                };
            }[];
            tileWidthMm: number | null;
            tileLengthMm: number | null;
            fallbackColor: string | null;
            texture: {
                /** Format: uuid */
                id: string;
                /** Format: uri */
                url: string;
            } | null;
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        CreateProductDto: {
            /** Format: uuid */
            categoryId: string;
            /** Format: uuid */
            materialTypeId: string;
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            brand: string;
            manufacturer: string;
            color: {
                en: string;
                uk: string;
            };
            size: {
                en: string;
                uk: string;
            };
            priceCents: number;
            /** @default false */
            confirmZeroPrice: boolean;
            /** @enum {string} */
            unit: "SQM" | "LINEAR_M" | "PIECE";
            wastePercentOverride?: number | null;
            heatedFloorCompatible: boolean;
            images: {
                /** Format: uuid */
                imageId: string;
                isPrimary: boolean;
            }[];
            attributes: {
                name: {
                    en: string;
                    uk: string;
                };
                value: {
                    en: string;
                    uk: string;
                };
            }[];
            textureImageId?: string | null;
            tileWidthMm?: number | null;
            tileLengthMm?: number | null;
            fallbackColor?: string | null;
        };
        PatchProductDto: {
            /** Format: uuid */
            categoryId?: string;
            /** Format: uuid */
            materialTypeId?: string;
            name?: {
                en: string;
                uk: string;
            };
            description?: {
                en: string;
                uk: string;
            };
            brand?: string;
            manufacturer?: string;
            color?: {
                en: string;
                uk: string;
            };
            size?: {
                en: string;
                uk: string;
            };
            priceCents?: number;
            /** @default false */
            confirmZeroPrice: boolean;
            /** @enum {string} */
            unit?: "SQM" | "LINEAR_M" | "PIECE";
            wastePercentOverride?: number | null;
            heatedFloorCompatible?: boolean;
            images?: {
                /** Format: uuid */
                imageId: string;
                isPrimary: boolean;
            }[];
            attributes?: {
                name: {
                    en: string;
                    uk: string;
                };
                value: {
                    en: string;
                    uk: string;
                };
            }[];
            textureImageId?: string | null;
            tileWidthMm?: number | null;
            tileLengthMm?: number | null;
            fallbackColor?: string | null;
            /** Format: uuid */
            revision: string;
        };
        UpdateProductStatusDto: {
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
        };
        ProductStatusResponseDto_Output: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            categoryId: string;
            /** Format: uuid */
            materialTypeId: string;
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            brand: string;
            manufacturer: string;
            color: {
                en: string;
                uk: string;
            };
            size: {
                en: string;
                uk: string;
            };
            priceCents: number;
            /** @enum {string} */
            unit: "SQM" | "LINEAR_M" | "PIECE";
            wastePercentOverride: number | null;
            heatedFloorCompatible: boolean;
            images: {
                /** Format: uuid */
                id: string;
                /** Format: uri */
                thumb: string;
                /** Format: uri */
                card: string;
                /** Format: uri */
                zoom: string;
                isPrimary: boolean;
            }[];
            attributes: {
                name: {
                    en: string;
                    uk: string;
                };
                value: {
                    en: string;
                    uk: string;
                };
            }[];
            tileWidthMm: number | null;
            tileLengthMm: number | null;
            fallbackColor: string | null;
            texture: {
                /** Format: uuid */
                id: string;
                /** Format: uri */
                url: string;
            } | null;
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
            warnings?: {
                /** @constant */
                code: "USED_AS_DEFAULT_MATERIAL";
                params: {
                    styles: {
                        /** Format: uuid */
                        id: string;
                        name: {
                            en: string;
                            uk: string;
                        };
                    }[];
                };
            }[];
        };
        StyleAdminListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                name: {
                    en: string;
                    uk: string;
                };
                description: {
                    en: string;
                    uk: string;
                };
                image: {
                    /** Format: uuid */
                    id: string;
                    /** Format: uri */
                    thumb: string;
                    /** Format: uri */
                    card: string;
                    /** Format: uri */
                    zoom: string;
                } | null;
                /** @enum {string} */
                status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                sortOrder: number;
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
                unfilledPairs: number;
                unavailablePairs: number;
            }[];
        };
        StyleAdminDto_Output: {
            /** Format: uuid */
            id: string;
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            image: {
                /** Format: uuid */
                id: string;
                /** Format: uri */
                thumb: string;
                /** Format: uri */
                card: string;
                /** Format: uri */
                zoom: string;
            } | null;
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            sortOrder: number;
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
            pairs: {
                /** @enum {string} */
                roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                /** Format: uuid */
                roomTypeId: string;
                /** Format: uuid */
                categoryId: string;
                categoryName: {
                    en: string;
                    uk: string;
                };
                productId: string | null;
                productName: {
                    en: string;
                    uk: string;
                } | null;
                /** @enum {string} */
                state: "FILLED" | "EMPTY" | "PRODUCT_UNAVAILABLE";
            }[];
            unfilledCount: number;
            unavailableCount: number;
        };
        CreateStyleDto: {
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            /** Format: uuid */
            imageId?: string;
        };
        PatchStyleDto: {
            name?: {
                en: string;
                uk: string;
            };
            description?: {
                en: string;
                uk: string;
            };
            imageId?: string | null;
            /** Format: uuid */
            revision: string;
        };
        StyleOrderDto: {
            styleIds: string[];
        };
        UpdateStyleStatusDto: {
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
        };
        StyleDefaultMaterialsDto: {
            items: {
                /** Format: uuid */
                roomTypeId: string;
                /** Format: uuid */
                categoryId: string;
                productId: string | null;
            }[];
            /** Format: uuid */
            revision: string;
        };
        EngineeringPackageItemAdminListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                name: {
                    en: string;
                    uk: string;
                };
                description: {
                    en: string;
                    uk: string;
                };
                includedInBase: boolean;
                priceCents: number | null;
                unit: ("PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT") | null;
                /** @enum {string} */
                status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                sortOrder: number;
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
        };
        CreateEngineeringPackageItemDto: {
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            includedInBase: boolean;
            priceCents?: number;
            /** @enum {string} */
            unit?: "PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT";
        };
        EngineeringPackageItemAdminDto_Output: {
            /** Format: uuid */
            id: string;
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            includedInBase: boolean;
            priceCents: number | null;
            unit: ("PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT") | null;
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            sortOrder: number;
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        PatchEngineeringPackageItemDto: {
            name?: {
                en: string;
                uk: string;
            };
            description?: {
                en: string;
                uk: string;
            };
            includedInBase?: boolean;
            priceCents?: number | null;
            unit?: ("PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT") | null;
            /** Format: uuid */
            revision: string;
        };
        UpdateEngineeringPackageItemStatusDto: {
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
        };
        EngineeringPackageItemOrderDto: {
            ids: string[];
        };
        OptionAdminListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                /** @enum {string} */
                kind: "ENGINEERING" | "ADDITIONAL";
                name: {
                    en: string;
                    uk: string;
                };
                description: {
                    en: string;
                    uk: string;
                };
                image: {
                    /** Format: uuid */
                    id: string;
                    /** Format: uri */
                    thumb: string;
                    /** Format: uri */
                    card: string;
                    /** Format: uri */
                    zoom: string;
                } | null;
                priceCents: number;
                /** @enum {string} */
                unit: "PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT";
                perRoom: boolean;
                minQuantity: number | null;
                maxQuantity: number | null;
                roomTypeIds: string[];
                sortOrder: number;
                /** @enum {string} */
                status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
        };
        OptionAdminDto_Output: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            kind: "ENGINEERING" | "ADDITIONAL";
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            image: {
                /** Format: uuid */
                id: string;
                /** Format: uri */
                thumb: string;
                /** Format: uri */
                card: string;
                /** Format: uri */
                zoom: string;
            } | null;
            priceCents: number;
            /** @enum {string} */
            unit: "PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT";
            perRoom: boolean;
            minQuantity: number | null;
            maxQuantity: number | null;
            roomTypeIds: string[];
            sortOrder: number;
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        CreateOptionDto: {
            /** @enum {string} */
            kind: "ENGINEERING" | "ADDITIONAL";
            name: {
                en: string;
                uk: string;
            };
            description: {
                en: string;
                uk: string;
            };
            /** Format: uuid */
            imageId?: string;
            priceCents: number;
            /** @default false */
            confirmZeroPrice: boolean;
            /** @enum {string} */
            unit: "PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT";
            minQuantity?: number;
            maxQuantity?: number;
            roomTypeIds: string[];
        };
        PatchOptionDto: {
            /** @enum {string} */
            kind?: "ENGINEERING" | "ADDITIONAL";
            name?: {
                en: string;
                uk: string;
            };
            description?: {
                en: string;
                uk: string;
            };
            imageId?: string | null;
            priceCents?: number;
            confirmZeroPrice?: boolean;
            /** @enum {string} */
            unit?: "PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT";
            minQuantity?: number | null;
            maxQuantity?: number | null;
            roomTypeIds?: string[];
            /** Format: uuid */
            revision: string;
        };
        OptionOrderDto: {
            /** @enum {string} */
            kind: "ENGINEERING" | "ADDITIONAL";
            ids: string[];
        };
        UpdateOptionStatusDto: {
            /** @enum {string} */
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            /** Format: uuid */
            revision: string;
        };
        PricingDataResponseDto_Output: {
            version: string;
            exchangeRate: {
                rate: string;
                date: string;
                /** @enum {string} */
                source: "NBU" | "MANUAL";
            } | null;
            limits: {
                totalAreaSqm: {
                    min: number;
                    max: number;
                };
                rooms: {
                    min: number;
                    max: number;
                };
                roomSideM: {
                    min: number;
                    max: number;
                };
                roomHeightM: {
                    min: number;
                    max: number;
                };
            };
            baseRates: {
                /** @enum {string} */
                finishLevel: "ROUGH" | "PRE_FINISH";
                areaFromSqm: number;
                areaToSqm: number;
                rateCentsPerSqm: number;
            }[];
            coefficients: {
                [key: string]: number;
            };
            rules: {
                id: string;
                /** @enum {string} */
                level: "OBJECT" | "CATEGORY" | "MATERIAL_TYPE";
                categoryId: string | null;
                materialTypeId: string | null;
                name: {
                    en: string;
                    uk: string;
                };
                quantityFormula: string | null;
                costFormula: string;
                sortOrder: number;
            }[];
            roomTypes: {
                id: string;
                code: string;
            }[];
            categories: {
                id: string;
                wastePercent: number;
                /** @enum {string} */
                surface: "NONE" | "FLOOR" | "WALLS" | "CEILING";
            }[];
            materialTypes: {
                id: string;
                code: string;
            }[];
            products: {
                id: string;
                categoryId: string;
                materialTypeId: string;
                priceCents: number;
                /** @enum {string} */
                unit: "SQM" | "LINEAR_M" | "PIECE";
                wastePercentOverride: number | null;
                heatedFloorCompatible: boolean;
                available: boolean;
            }[];
            packageItems: {
                id: string;
                includedInBase: boolean;
                priceCents: number | null;
                unit: ("PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT") | null;
            }[];
            options: {
                id: string;
                /** @enum {string} */
                kind: "ENGINEERING" | "ADDITIONAL";
                priceCents: number;
                /** @enum {string} */
                unit: "PIECE" | "ROOM_SQM" | "ROOM" | "PROJECT";
                roomTypeCodes: string[];
                minQuantity: number | null;
                maxQuantity: number | null;
                available: boolean;
            }[];
        };
        EstimateRequestDto: {
            configuration: {
                /** @enum {string} */
                finishLevel: "ROUGH" | "PRE_FINISH";
                totalAreaSqm: number;
                balconyAreaSqm: number;
                balconyTiles: boolean;
                gas: boolean;
                /** @enum {string} */
                kitchenType: "SEPARATE" | "KITCHEN_LIVING";
                rooms: {
                    clientId: string;
                    /** @enum {string} */
                    roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                    lengthM: number;
                    widthM: number;
                    heightM: number;
                    heatedFloor: boolean;
                    selections: {
                        categoryId: string;
                        productId: string | null;
                    }[];
                }[];
                options: {
                    optionId: string;
                    quantity?: number;
                    roomClientIds?: string[];
                }[];
                /** @enum {string} */
                currency: "USD" | "UAH";
            };
            clientPricingVersion?: string;
        };
        EstimateResponseDto_Output: {
            estimate: {
                pricingVersion: string;
                /** @enum {string} */
                currency: "USD" | "UAH";
                exchangeRate: {
                    rate: string;
                    date: string;
                    /** @enum {string} */
                    source: "NBU" | "MANUAL";
                } | null;
                lines: {
                    id: string;
                    /** @enum {string} */
                    section: "BASE" | "OBJECT" | "MATERIALS" | "ENGINEERING" | "ADDITIONAL";
                    /** @enum {string} */
                    status: "OK" | "INCLUDED" | "NOT_CALCULATED" | "UNAVAILABLE" | "ERROR";
                    roomClientId: string | null;
                    categoryId: string | null;
                    productId: string | null;
                    optionId: string | null;
                    packageItemId: string | null;
                    ruleId: string | null;
                    quantity: number | null;
                    unit: string | null;
                    unitPriceCents: number | null;
                    amountCents: number;
                    amountUahKopecks: number | null;
                    warnings: {
                        code: string;
                        params?: {
                            [key: string]: unknown;
                        };
                    }[];
                    error: {
                        code: string;
                        params?: {
                            [key: string]: unknown;
                        };
                    } | null;
                }[];
                totals: {
                    usdCents: number;
                    uahKopecks: number | null;
                    sections: {
                        [key: string]: {
                            usdCents: number;
                            uahKopecks: number | null;
                        };
                    };
                };
                warnings: {
                    code: string;
                    params?: {
                        [key: string]: unknown;
                    };
                    lineId?: string;
                }[];
                incomplete: boolean;
            };
            stale: boolean;
            pricingVersion: string;
        };
        RuleListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                /** @enum {string} */
                level: "OBJECT" | "CATEGORY" | "MATERIAL_TYPE";
                categoryId: string | null;
                materialTypeId: string | null;
                name: {
                    en: string;
                    uk: string;
                };
                quantityFormula: string | null;
                costFormula: string;
                coefficientKeys: string[];
                sortOrder: number;
                orphaned: boolean;
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
            categoriesWithoutRule: {
                /** Format: uuid */
                id: string;
                name: {
                    en: string;
                    uk: string;
                };
            }[];
        };
        RuleInputDto: {
            /** @enum {string} */
            level: "OBJECT" | "CATEGORY" | "MATERIAL_TYPE";
            categoryId?: string | null;
            materialTypeId?: string | null;
            name: {
                en: string;
                uk: string;
            };
            quantityFormula?: string | null;
            costFormula: string;
        };
        RuleAdminDto_Output: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            level: "OBJECT" | "CATEGORY" | "MATERIAL_TYPE";
            categoryId: string | null;
            materialTypeId: string | null;
            name: {
                en: string;
                uk: string;
            };
            quantityFormula: string[];
            costFormula: string;
            coefficientKeys: string[];
            sortOrder: number;
            orphaned: boolean;
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        PreviewRuleDto: {
            /** @enum {string} */
            level: "OBJECT" | "CATEGORY" | "MATERIAL_TYPE";
            quantityFormula?: string | null;
            costFormula: string;
            sample: {
                room?: {
                    /** @enum {string} */
                    roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                    lengthM: number;
                    widthM: number;
                    heightM: number;
                    heatedFloor: boolean;
                };
                product?: {
                    priceCents: number;
                    /** @enum {string} */
                    unit: "SQM" | "LINEAR_M" | "PIECE";
                    wastePercent: number;
                };
                object: {
                    totalAreaSqm: number;
                    balconyAreaSqm: number;
                    balconyTiles: boolean;
                    gas: boolean;
                    /** @enum {string} */
                    kitchenType: "SEPARATE" | "KITCHEN_LIVING";
                    /** @enum {string} */
                    finishLevel: "ROUGH" | "PRE_FINISH";
                    roomsCount: number;
                    bathroomsCount: number;
                };
            };
        };
        RulePreviewDto_Output: {
            quantity: number[];
            amountCents: number | null;
            variables: {
                [key: string]: number | boolean | string;
            };
            coefficients: {
                [key: string]: number;
            };
            error: {
                code: string;
                params?: {
                    [key: string]: unknown;
                };
            } | null;
        };
        RuleOrderDto: {
            ids: string[];
        };
        UpdateRuleDto: {
            name?: {
                en: string;
                uk: string;
            };
            quantityFormula?: string | null;
            costFormula?: string;
            /** Format: uuid */
            revision: string;
        };
        ValidateFormulasDto: {
            /** @enum {string} */
            level: "OBJECT" | "CATEGORY" | "MATERIAL_TYPE";
            quantityFormula?: string | null;
            costFormula: string;
        };
        ValidateFormulasResponseDto_Output: {
            valid: boolean;
            coefficientKeys: string[];
            errors: {
                /** @enum {string} */
                formula: "quantity" | "cost";
                code: string;
                position: number;
                length: number;
                params?: {
                    [key: string]: string | number;
                };
            }[];
        };
        BaseRateListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                /** @enum {string} */
                finishLevel: "ROUGH" | "PRE_FINISH";
                areaFromSqm: number;
                areaToSqm: number;
                rateCentsPerSqm: number;
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
            gaps: {
                /** @enum {string} */
                finishLevel: "ROUGH" | "PRE_FINISH";
                fromSqm: number;
                toSqm: number;
            }[];
        };
        BaseRateInputDto: {
            /** @enum {string} */
            finishLevel: "ROUGH" | "PRE_FINISH";
            areaFromSqm: number;
            areaToSqm: number;
            rateCentsPerSqm: number;
        };
        BaseRateAdminDto_Output: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            finishLevel: "ROUGH" | "PRE_FINISH";
            areaFromSqm: number;
            areaToSqm: number;
            rateCentsPerSqm: number;
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        UpdateBaseRateDto: {
            /** @enum {string} */
            finishLevel?: "ROUGH" | "PRE_FINISH";
            areaFromSqm?: number;
            areaToSqm?: number;
            rateCentsPerSqm?: number;
            /** Format: uuid */
            revision: string;
        };
        CoefficientListResponseDto_Output: {
            items: {
                /** Format: uuid */
                id: string;
                key: string;
                name: {
                    en: string;
                    uk: string;
                };
                value: number;
                unit: {
                    en: string;
                    uk: string;
                };
                usedBy: {
                    /** Format: uuid */
                    ruleId: string;
                    ruleName: {
                        en: string;
                        uk: string;
                    };
                }[];
                /** Format: uuid */
                revision: string;
                /** Format: date-time */
                updatedAt: string;
                updatedBy: {
                    /** Format: uuid */
                    id: string;
                    login: string;
                } | null;
            }[];
        };
        CoefficientInputDto: {
            key: string;
            name: {
                en: string;
                uk: string;
            };
            value: number;
            unit: {
                en: string;
                uk: string;
            };
        };
        CoefficientAdminDto_Output: {
            /** Format: uuid */
            id: string;
            key: string;
            name: {
                en: string;
                uk: string;
            };
            value: number;
            unit: {
                en: string;
                uk: string;
            };
            usedBy: {
                /** Format: uuid */
                ruleId: string;
                ruleName: {
                    en: string;
                    uk: string;
                };
            }[];
            /** Format: uuid */
            revision: string;
            /** Format: date-time */
            updatedAt: string;
            updatedBy: {
                /** Format: uuid */
                id: string;
                login: string;
            } | null;
        };
        UpdateCoefficientDto: {
            key?: string;
            name?: {
                en: string;
                uk: string;
            };
            value?: number;
            unit?: {
                en: string;
                uk: string;
            };
            /** Format: uuid */
            revision: string;
        };
        ExchangeRateStatusDto_Output: {
            active: {
                rate: string;
                /** Format: date */
                date: string;
                /** @enum {string} */
                source: "NBU" | "MANUAL";
            } | null;
            official: {
                rate: string;
                /** Format: date */
                date: string;
            } | null;
            manual: {
                rate: string;
                /** Format: date */
                date: string;
            } | null;
            lastSuccessfulFetchDate: string | null;
            lastAttemptAt: string | null;
            lastError: string[];
            staleSince: string | null;
        };
        ManualRateInputDto: {
            rate: string;
        };
        SaveCalculationRequestDto: {
            configuration: {
                /** @enum {string} */
                finishLevel: "ROUGH" | "PRE_FINISH";
                totalAreaSqm: number;
                balconyAreaSqm: number;
                balconyTiles: boolean;
                gas: boolean;
                /** @enum {string} */
                kitchenType: "SEPARATE" | "KITCHEN_LIVING";
                rooms: {
                    clientId: string;
                    /** @enum {string} */
                    roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                    lengthM: number;
                    widthM: number;
                    heightM: number;
                    heatedFloor: boolean;
                    selections: {
                        categoryId: string;
                        productId: string | null;
                    }[];
                }[];
                options: {
                    optionId: string;
                    quantity?: number;
                    roomClientIds?: string[];
                }[];
                /** @enum {string} */
                currency: "USD" | "UAH";
            };
            /** Format: uuid */
            styleId: string;
            clientPricingVersion: string;
            clientTotalUsdCents: number;
        };
        SaveCalculationResponseDto_Output: {
            version: {
                publicId: string;
                number: number;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                expiresAt: string;
                expired: boolean;
                incomplete: boolean;
                pricingVersion: string;
                style: {
                    id: string;
                    name: string;
                } | null;
                configuration: {
                    /** @enum {string} */
                    finishLevel: "ROUGH" | "PRE_FINISH";
                    totalAreaSqm: number;
                    balconyAreaSqm: number;
                    balconyTiles: boolean;
                    gas: boolean;
                    /** @enum {string} */
                    kitchenType: "SEPARATE" | "KITCHEN_LIVING";
                    rooms: {
                        clientId: string;
                        /** @enum {string} */
                        roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                        lengthM: number;
                        widthM: number;
                        heightM: number;
                        heatedFloor: boolean;
                        selections: {
                            categoryId: string;
                            productId: string | null;
                        }[];
                    }[];
                    options: {
                        optionId: string;
                        quantity?: number;
                        roomClientIds?: string[];
                    }[];
                    /** @enum {string} */
                    currency: "USD" | "UAH";
                };
                rooms: {
                    clientId: string;
                    /** @enum {string} */
                    roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                    lengthM: number;
                    widthM: number;
                    heightM: number;
                    heatedFloor: boolean;
                    name: string;
                }[];
                lines: {
                    id: string;
                    /** @enum {string} */
                    section: "BASE" | "OBJECT" | "MATERIALS" | "ENGINEERING" | "ADDITIONAL";
                    /** @enum {string} */
                    status: "OK" | "INCLUDED" | "NOT_CALCULATED" | "UNAVAILABLE" | "ERROR";
                    roomClientId: string | null;
                    categoryId: string | null;
                    productId: string | null;
                    optionId: string | null;
                    packageItemId: string | null;
                    ruleId: string | null;
                    quantity: number | null;
                    unit: string | null;
                    unitPriceCents: number | null;
                    amountCents: number;
                    amountUahKopecks: number | null;
                    warnings: {
                        code: string;
                        params?: {
                            [key: string]: unknown;
                        };
                    }[];
                    error: {
                        code: string;
                        params?: {
                            [key: string]: unknown;
                        };
                    } | null;
                    roomName: string | null;
                    categoryName: string | null;
                    optionName: string | null;
                    packageItemName: string | null;
                    ruleName: string | null;
                    product: {
                        name: string;
                        brand: string;
                        manufacturer: string;
                        color: string;
                        size: string;
                        image: {
                            /** Format: uuid */
                            id: string;
                            /** Format: uri */
                            thumb: string;
                            /** Format: uri */
                            card: string;
                            /** Format: uri */
                            zoom: string;
                        } | null;
                    } | null;
                }[];
                totals: {
                    usdCents: number;
                    uahKopecks: number | null;
                    sections: {
                        [key: string]: {
                            usdCents: number;
                            uahKopecks: number | null;
                        };
                    };
                };
                warnings: {
                    code: string;
                    params?: {
                        [key: string]: unknown;
                    };
                    lineId?: string;
                }[];
                exchangeRate: {
                    rate: string;
                    date: string;
                    /** @enum {string} */
                    source: "NBU" | "MANUAL";
                } | null;
                priceStatus: {
                    changed: boolean;
                    snapshotTotalUsdCents: number;
                    currentTotalUsdCents: number;
                    diffCents: number;
                    unavailableItems: {
                        lineId: string;
                        productId: string | null;
                        optionId: string | null;
                    }[];
                    currentPricingVersion: string;
                } | null;
                versions: {
                    number: number;
                    /** Format: date-time */
                    createdAt: string;
                    totalUsdCents: number;
                    expired: boolean;
                }[];
            };
            priceDifference: {
                clientTotalUsdCents: number;
                savedTotalUsdCents: number;
                diffCents: number;
            } | null;
        };
        RecalculateCalculationRequestDto: {
            basedOnVersion: number;
        };
        VersionViewDto_Output: {
            publicId: string;
            number: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            expiresAt: string;
            expired: boolean;
            incomplete: boolean;
            pricingVersion: string;
            style: {
                id: string;
                name: string;
            } | null;
            configuration: {
                /** @enum {string} */
                finishLevel: "ROUGH" | "PRE_FINISH";
                totalAreaSqm: number;
                balconyAreaSqm: number;
                balconyTiles: boolean;
                gas: boolean;
                /** @enum {string} */
                kitchenType: "SEPARATE" | "KITCHEN_LIVING";
                rooms: {
                    clientId: string;
                    /** @enum {string} */
                    roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                    lengthM: number;
                    widthM: number;
                    heightM: number;
                    heatedFloor: boolean;
                    selections: {
                        categoryId: string;
                        productId: string | null;
                    }[];
                }[];
                options: {
                    optionId: string;
                    quantity?: number;
                    roomClientIds?: string[];
                }[];
                /** @enum {string} */
                currency: "USD" | "UAH";
            };
            rooms: {
                clientId: string;
                /** @enum {string} */
                roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                lengthM: number;
                widthM: number;
                heightM: number;
                heatedFloor: boolean;
                name: string;
            }[];
            lines: {
                id: string;
                /** @enum {string} */
                section: "BASE" | "OBJECT" | "MATERIALS" | "ENGINEERING" | "ADDITIONAL";
                /** @enum {string} */
                status: "OK" | "INCLUDED" | "NOT_CALCULATED" | "UNAVAILABLE" | "ERROR";
                roomClientId: string | null;
                categoryId: string | null;
                productId: string | null;
                optionId: string | null;
                packageItemId: string | null;
                ruleId: string | null;
                quantity: number | null;
                unit: string | null;
                unitPriceCents: number | null;
                amountCents: number;
                amountUahKopecks: number | null;
                warnings: {
                    code: string;
                    params?: {
                        [key: string]: unknown;
                    };
                }[];
                error: {
                    code: string;
                    params?: {
                        [key: string]: unknown;
                    };
                } | null;
                roomName: string | null;
                categoryName: string | null;
                optionName: string | null;
                packageItemName: string | null;
                ruleName: string | null;
                product: {
                    name: string;
                    brand: string;
                    manufacturer: string;
                    color: string;
                    size: string;
                    image: {
                        /** Format: uuid */
                        id: string;
                        /** Format: uri */
                        thumb: string;
                        /** Format: uri */
                        card: string;
                        /** Format: uri */
                        zoom: string;
                    } | null;
                } | null;
            }[];
            totals: {
                usdCents: number;
                uahKopecks: number | null;
                sections: {
                    [key: string]: {
                        usdCents: number;
                        uahKopecks: number | null;
                    };
                };
            };
            warnings: {
                code: string;
                params?: {
                    [key: string]: unknown;
                };
                lineId?: string;
            }[];
            exchangeRate: {
                rate: string;
                date: string;
                /** @enum {string} */
                source: "NBU" | "MANUAL";
            } | null;
            priceStatus: {
                changed: boolean;
                snapshotTotalUsdCents: number;
                currentTotalUsdCents: number;
                diffCents: number;
                unavailableItems: {
                    lineId: string;
                    productId: string | null;
                    optionId: string | null;
                }[];
                currentPricingVersion: string;
            } | null;
            versions: {
                number: number;
                /** Format: date-time */
                createdAt: string;
                totalUsdCents: number;
                expired: boolean;
            }[];
        };
        CreateLeadRequestDto: {
            calculation?: {
                publicId: string;
                versionNumber: number;
            };
            draft?: {
                configuration: {
                    /** @enum {string} */
                    finishLevel: "ROUGH" | "PRE_FINISH";
                    totalAreaSqm: number;
                    balconyAreaSqm: number;
                    balconyTiles: boolean;
                    gas: boolean;
                    /** @enum {string} */
                    kitchenType: "SEPARATE" | "KITCHEN_LIVING";
                    rooms: {
                        clientId: string;
                        /** @enum {string} */
                        roomTypeCode: "LIVING_ROOM" | "BEDROOM" | "KITCHEN" | "KITCHEN_LIVING" | "BATHROOM";
                        lengthM: number;
                        widthM: number;
                        heightM: number;
                        heatedFloor: boolean;
                        selections: {
                            categoryId: string;
                            productId: string | null;
                        }[];
                    }[];
                    options: {
                        optionId: string;
                        quantity?: number;
                        roomClientIds?: string[];
                    }[];
                    /** @enum {string} */
                    currency: "USD" | "UAH";
                };
                /** Format: uuid */
                styleId: string;
                clientPricingVersion: string;
            };
            name: string;
            phone: string;
            email?: string | "";
            comment?: string;
            consent: {
                /** @constant */
                accepted: true;
                text: string;
            };
            /** @enum {string} */
            locale: "en" | "uk";
            website?: string;
        };
        CreateLeadResponseDto_Output: {
            leadNumber: number;
            calculation: {
                publicId: string;
                versionNumber: number;
            };
            expiredAtSubmission: boolean;
        };
        LeadFormSettingsDto_Output: {
            retentionDays: number;
            notice: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    HealthController_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponseDto_Output"];
                };
            };
        };
    };
    MaintenanceController_run: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MaintenanceRunResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AuthController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminMeDto_Output"];
                };
            };
            /** @description INVALID_CREDENTIALS */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description ACCOUNT_LOCKED */
            423: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RATE_LIMITED */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminMeDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AuthController_changePassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePasswordDto"];
            };
        };
        responses: {
            /** @description Password changed. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED | INVALID_CREDENTIALS */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description DEMO_FORBIDDEN */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description ACCOUNT_LOCKED */
            423: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RATE_LIMITED */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicCatalogController_listStyles: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicStylesResponseDto_Output"];
                };
            };
        };
    };
    PublicCatalogController_listRoomTypes: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicRoomTypesResponseDto_Output"];
                };
            };
        };
    };
    PublicCatalogController_listCategoryProducts: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header?: never;
            path: {
                categoryId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicProductCardsResponseDto_Output"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicCatalogController_getProduct: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header?: never;
            path: {
                productId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicProductDetailsResponseDto_Output"];
                };
            };
            /** @description NOT_FOUND | PRODUCT_UNAVAILABLE */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicCatalogController_getStyleDefaultMaterials: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                styleId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicDefaultMaterialsResponseDto_Output"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicCatalogController_getEngineering: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicEngineeringResponseDto_Output"];
                };
            };
        };
    };
    ImagesController_upload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminImageDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description PAYLOAD_TOO_LARGE */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNSUPPORTED_IMAGE_TYPE */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RATE_LIMITED */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description IMAGE_STORAGE_FAILED */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RoomTypesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoomTypeAdminListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RoomTypesController_updateName: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchRoomTypeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoomTypeAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RoomTypesController_replaceCategories: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReplaceRoomTypeCategoriesDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoomTypeAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CATEGORY_ARCHIVED | CATEGORY_NOT_FOUND */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CategoriesController_list: {
        parameters: {
            query?: {
                status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryAdminListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CategoriesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCategoryDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryAdminDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CategoriesController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CATEGORY_IN_USE */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CategoriesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchCategoryDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description SURFACE_DATA_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CategoriesController_updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCategoryStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description TRANSLATION_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    MaterialTypesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MaterialTypeAdminListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    MaterialTypesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateMaterialTypeDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MaterialTypeAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CODE_TAKEN */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    MaterialTypesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateMaterialTypeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MaterialTypeAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description TRANSLATION_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ProductsController_list: {
        parameters: {
            query?: {
                page?: number;
                pageSize?: number;
                categoryId?: string;
                status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductAdminListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ProductsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateProductDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductAdminDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CATEGORY_NOT_FOUND | MATERIAL_TYPE_NOT_FOUND | IMAGE_NOT_FOUND | ZERO_PRICE_NOT_CONFIRMED */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ProductsController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ProductsController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description PRODUCT_IN_USE */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ProductsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchProductDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION | PRODUCT_IN_USE */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CATEGORY_NOT_FOUND | MATERIAL_TYPE_NOT_FOUND | IMAGE_NOT_FOUND | ZERO_PRICE_NOT_CONFIRMED | SURFACE_DATA_MISSING | PRIMARY_IMAGE_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ProductsController_changeStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProductStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductStatusResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description TRANSLATION_MISSING | SURFACE_DATA_MISSING | PRIMARY_IMAGE_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    StylesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StyleAdminListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    StylesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateStyleDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StyleAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description IMAGE_NOT_FOUND */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    StylesController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StyleAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    StylesController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    StylesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchStyleDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StyleAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description IMAGE_NOT_FOUND | TRANSLATION_MISSING | STYLE_IMAGE_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    StylesController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StyleOrderDto"];
            };
        };
        responses: {
            /** @description Reordered. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STYLE_SET_MISMATCH */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    StylesController_updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateStyleStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StyleAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description TRANSLATION_MISSING | STYLE_IMAGE_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    StylesController_updateDefaultMaterials: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StyleDefaultMaterialsDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StyleAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description PAIR_NOT_IN_ROOM_TYPE | PRODUCT_CATEGORY_MISMATCH | PRODUCT_NOT_FOUND */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    EngineeringPackageItemsController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EngineeringPackageItemAdminListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    EngineeringPackageItemsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateEngineeringPackageItemDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EngineeringPackageItemAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description PRICE_REQUIRED */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    EngineeringPackageItemsController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    EngineeringPackageItemsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchEngineeringPackageItemDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EngineeringPackageItemAdminDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description PRICE_REQUIRED */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    EngineeringPackageItemsController_updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateEngineeringPackageItemStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EngineeringPackageItemAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description TRANSLATION_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    EngineeringPackageItemsController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EngineeringPackageItemOrderDto"];
            };
        };
        responses: {
            /** @description Reordered. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CONFLICT */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    OptionsController_list: {
        parameters: {
            query?: {
                kind?: "ENGINEERING" | "ADDITIONAL";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OptionAdminListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    OptionsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateOptionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OptionAdminDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description IMAGE_NOT_FOUND | QUANTITY_BOUNDS_REQUIRED | ROOM_TYPES_NOT_ALLOWED | ROOM_TYPE_NOT_FOUND | ZERO_PRICE_NOT_CONFIRMED */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    OptionsController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OptionAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    OptionsController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    OptionsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchOptionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OptionAdminDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description IMAGE_NOT_FOUND | QUANTITY_BOUNDS_REQUIRED | ROOM_TYPES_NOT_ALLOWED | ROOM_TYPE_NOT_FOUND | ZERO_PRICE_NOT_CONFIRMED */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    OptionsController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OptionOrderDto"];
            };
        };
        responses: {
            /** @description Reordered. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CONFLICT */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    OptionsController_updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateOptionStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OptionAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description TRANSLATION_MISSING */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicPricingController_getPricingData: {
        parameters: {
            query?: never;
            header?: {
                /** @description ETag value from a previous response, quotes included. */
                "If-None-Match"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Pricing version in quotes. */
                    ETag?: string;
                    /** @description Shared caching policy for pricing data. */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PricingDataResponseDto_Output"];
                };
            };
            /** @description If-None-Match matches the current ETag. */
            304: {
                headers: {
                    /** @description Pricing version in quotes. */
                    ETag?: string;
                    /** @description Shared caching policy for pricing data. */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicPricingController_createEstimate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EstimateRequestDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EstimateResponseDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description INPUT_OUT_OF_BOUNDS | UNKNOWN_REFERENCE */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RATE_LIMITED */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RulesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RuleListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RulesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RuleInputDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RuleAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RULE_EXISTS */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description FORMULA_INVALID, UNKNOWN_REFERENCE */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RulesController_preview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PreviewRuleDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RulePreviewDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description FORMULA_INVALID */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RulesController_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RuleOrderDto"];
            };
        };
        responses: {
            /** @description Reordered. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RulesController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    RulesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateRuleDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RuleAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description FORMULA_INVALID */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    FormulasController_validate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ValidateFormulasDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateFormulasResponseDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    BaseRatesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BaseRateListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    BaseRatesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BaseRateInputDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BaseRateAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RANGE_OVERLAP */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    BaseRatesController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    BaseRatesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateBaseRateDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BaseRateAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RANGE_OVERLAP, STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CoefficientsController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CoefficientListResponseDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CoefficientsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CoefficientInputDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CoefficientAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description KEY_TAKEN */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CoefficientsController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description COEFFICIENT_IN_USE */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    CoefficientsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCoefficientDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CoefficientAdminDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description KEY_TAKEN, COEFFICIENT_IN_USE, STALE_REVISION */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ExchangeRateController_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExchangeRateStatusDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ExchangeRateController_setManual: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ManualRateInputDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExchangeRateStatusDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    ExchangeRateController_clearManual: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExchangeRateStatusDto_Output"];
                };
            };
            /** @description UNAUTHENTICATED */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicCalculationsController_create: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveCalculationRequestDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SaveCalculationResponseDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description INPUT_OUT_OF_BOUNDS | UNKNOWN_REFERENCE | STYLE_NOT_FOUND | IDEMPOTENCY_KEY_REUSED */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description IDEMPOTENCY_KEY_REQUIRED */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RATE_LIMITED */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicCalculationsController_recalculate: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header: {
                "Idempotency-Key": string;
            };
            path: {
                publicId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecalculateCalculationRequestDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VersionViewDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CALCULATION_NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description INPUT_OUT_OF_BOUNDS | UNKNOWN_REFERENCE | STYLE_NOT_FOUND | IDEMPOTENCY_KEY_REUSED */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description IDEMPOTENCY_KEY_REQUIRED */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RATE_LIMITED */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicCalculationsController_getLatest: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header?: never;
            path: {
                publicId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VersionViewDto_Output"];
                };
            };
            /** @description CALCULATION_NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicCalculationsController_getVersion: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header?: never;
            path: {
                publicId: string;
                number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VersionViewDto_Output"];
                };
            };
            /** @description CALCULATION_NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicLeadsController_create: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateLeadRequestDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateLeadResponseDto_Output"];
                };
            };
            /** @description VALIDATION_FAILED */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description CALCULATION_NOT_FOUND */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description PHONE_INVALID | INPUT_OUT_OF_BOUNDS | UNKNOWN_REFERENCE | STYLE_NOT_FOUND | IDEMPOTENCY_KEY_REUSED */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description IDEMPOTENCY_KEY_REQUIRED */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            /** @description RATE_LIMITED */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    PublicLeadsController_formSettings: {
        parameters: {
            query?: {
                lang?: "en" | "uk";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LeadFormSettingsDto_Output"];
                };
            };
        };
    };
}
