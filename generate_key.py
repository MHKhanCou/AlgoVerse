from secrets import token_hex

def generate_secret_key():
    return token_hex(32)

if __name__ == "__main__":
    secret_key = generate_secret_key()
    print("\nGenerated Secret Key:")
    print(secret_key)