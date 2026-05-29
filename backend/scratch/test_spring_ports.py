from app.services.analyzer import parse_spring_port

def test():
    # 1. Properties
    prop_content = """
    # Application properties
    spring.application.name=demo-app
    server.port=9090
    """
    p_port = parse_spring_port(prop_content, "application.properties")
    print(f"Properties Port: {p_port} (Expected: 9090)")
    
    # 2. YAML indented
    yaml_content = """
    spring:
      application:
        name: demo-app
    server:
      port: 7070
    logging:
      level: info
    """
    y_port = parse_spring_port(yaml_content, "application.yml")
    print(f"YAML Port: {y_port} (Expected: 7070)")
    
    # 3. YAML inline
    yaml_inline = """
    server.port: 6060
    """
    yi_port = parse_spring_port(yaml_inline, "application.yaml")
    print(f"YAML Inline Port: {yi_port} (Expected: 6060)")

if __name__ == "__main__":
    test()
