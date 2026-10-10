import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserEntity1789398389503 implements MigrationInterface {
    name = 'AddUserEntity1789398389503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "middleName" character varying NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."middleName" IS 'Отчество'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."email" IS 'E-mail'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "user"."email" IS 'E-mail'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."middleName" IS 'Отчество'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "middleName"`);
    }

}
