FROM postgres:18.0-alpine3.22

# Build-time argument to specify the number of processes for make
ARG MAKE_PROCS=4

# 1️⃣ Install build dependencies (cached if only pg_cron changes)
RUN apk add --no-cache --virtual .build-deps build-base git curl clang19 llvm19

# 2️⃣ Clone pg_cron (separate layer, cache reused if this step unchanged)
WORKDIR /tmp
RUN git clone https://github.com/citusdata/pg_cron.git

# 3️⃣ Build and install pg_cron
WORKDIR /tmp/pg_cron
RUN sed -i '/\.bc:/,+1d' Makefile \
    && sed -i '/install:.*\.bc/d' Makefile \
    && make -j ${MAKE_PROCS} USE_PGXS=1 PG_CPPFLAGS="-Iinclude -DUSE_PGXS" LLVM_CONFIG=false \
    && make install USE_PGXS=1

# 4️⃣ Remove build dependencies (reduces final image size)
RUN apk del .build-deps \
    && rm -rf /tmp/pg_cron

# 5️⃣ Create directory for pg_cron
RUN mkdir -p /var/lib/postgresql/data/cron \
    && chown -R postgres:postgres /var/lib/postgresql/data/cron

# 6️⃣ Enable pg_cron in PostgreSQL configuration
RUN echo "shared_preload_libraries = 'pg_cron'" >> /usr/local/share/postgresql/postgresql.conf.sample \
    && echo "cron.database_name = 'postgres'" >> /usr/local/share/postgresql/postgresql.conf.sample

# Switch back to default workdir
WORKDIR /var/lib/postgresql
