tables='rounds blocks transactions wallets'

for table in $tables
do
    dropcmd=$(echo "drop table if exists ${table};")
    psql -h localhost -U core -d core_development -c "${dropcmd}"
done

cd ../packages/core-database-postgres/src/migrations/

for sqlFile in ./*.sql
do
    sqlcmd=$(cat $sqlFile | sed 's/${schema~}\.//g')
    psql -h localhost -U core -d core_development -c "${sqlcmd}"
done