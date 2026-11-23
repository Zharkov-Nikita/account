import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBalanaceAndIsDeleted1795343975640 implements MigrationInterface {
    name = 'AddBalanaceAndIsDeleted1795343975640'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_207dec28c1b5028d8658d9a6f1"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "balance" character varying NOT NULL DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."balance" IS 'Баланс'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isDeleted" boolean DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isDeleted" IS 'Был ли удален аккаунт'`);
        await queryRunner.query(`CREATE INDEX "IDX_879e6347c8b70d3698eeefee76" ON "user"  ("user_id", "phone") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_879e6347c8b70d3698eeefee76"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isDeleted" IS 'Был ли удален аккаунт'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isDeleted"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."balance" IS 'Баланс'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "balance"`);
        await queryRunner.query(`CREATE INDEX "IDX_207dec28c1b5028d8658d9a6f1" ON "user" USING btree ("login", "phone") `);
    }

}
