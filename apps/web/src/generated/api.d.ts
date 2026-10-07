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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
                pageSize?: number;
                page?: number;
                status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
                categoryId?: string;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
        requestBody?: never;
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
}
