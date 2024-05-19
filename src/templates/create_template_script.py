import os

class ProjectScript:
    def __init__(self, folder_name):
        self.folder_name = folder_name
        self.current_dir = os.getcwd()
        self.new_folder_path = os.path.join(self.current_dir, self.folder_name)
    
    def create_folder(self):
        os.makedirs(self.new_folder_path, exist_ok=True)
        print(f"Pasta criada: {self.new_folder_path}")
    
    def create_index_html(self):
        file_path = os.path.join(self.new_folder_path, 'index.html')
        with open(file_path, 'w') as f:
            pass
        print(f"Arquivo criado: {file_path}")
    
    def create_index_js(self):
        file_path = os.path.join(self.new_folder_path, 'index.js')
        with open(file_path, 'w') as f:
            pass
        print(f"Arquivo criado: {file_path}")

    def fill_index_html(self, template):
        file_path = os.path.join(self.new_folder_path, 'index.html')
        with open(file_path, 'w') as f:
            f.write(template)
        print(f"Arquivo index.html preenchido com o template: {file_path}")

if __name__ == "__main__":
    folder_name = 'teste'
    project = ProjectScript(folder_name)
    project.create_folder()
    project.create_index_html()
    project.create_index_js()
    
    html_template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <h1>Hello, World!</h1>
    </body>
    </html>
    """
    project.fill_index_html(html_template)
