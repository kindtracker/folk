all: clean folk run

folk: folk.c
	cc -o folk folk.c

clean:
	rm -f folk

run:
	./folk $(TOKEN)

.PHONY: all clean run folk
