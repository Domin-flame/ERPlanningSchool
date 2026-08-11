from setuptools import setup

setup(
    name="globetrotter-shared",
    version="2.0.0",
    # The shared package files (__init__.py, jwt_utils.py) live at the same
    # level as this setup.py. Declare them explicitly so `pip install -e /shared`
    # exposes the `shared` module regardless of the build/install location.
    packages=["shared"],
    package_dir={"shared": "."},
    install_requires=["PyJWT==2.8.0"],
)
